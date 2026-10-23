import { toSanggunianRole } from '@lexigov/shared';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { InMemoryPresenceService, type PresenceService } from '../presence/presence.service';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { ListDraftsDto } from './dto/list-drafts.dto';
import { LogExportDto } from './dto/log-export.dto';
import { PresenceHeartbeatDto } from './dto/presence-heartbeat.dto';
import { RestoreVersionDto } from './dto/restore-version.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@ApiTags('Drafts')
@ApiBearerAuth()
@Controller('drafts')
@UseGuards(AuthGuard)
export class DraftsController {
  constructor(
    @Inject(DraftsService) private readonly draftsService: DraftsService,
    @Inject(InMemoryPresenceService) private readonly presenceService: PresenceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new draft' })
  @ApiResponse({ status: 201, description: 'Draft created' })
  create(@Body() dto: CreateDraftDto, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List drafts with pagination and filters' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListDraftsDto) {
    return this.draftsService.findAll(user.userId, query);
  }

  @Post(':id/presence')
  @ApiOperation({ summary: 'Register presence heartbeat for the current user on a draft' })
  @ApiResponse({ status: 201, description: 'Presence registered' })
  heartbeatPresence(
    @Param('id') id: string,
    @Body() dto: PresenceHeartbeatDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.presenceService.heartbeat(id, user.userId, dto?.section);
  }

  @Get(':id/presence')
  @ApiOperation({ summary: 'List active editors for a draft' })
  @ApiResponse({ status: 200, description: 'Active editors' })
  getActivePresence(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.presenceService.getActiveEditors(id, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single draft by ID' })
  @ApiResponse({ status: 200, description: 'Draft found' })
  @ApiResponse({ status: 404, description: 'Draft not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft' })
  @ApiResponse({ status: 200, description: 'Draft updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-sanggunian-role') roleHeader?: string,
  ) {
    const actorRole = toSanggunianRole(roleHeader || user.role, 'LEGISLATIVE_STAFF');
    return this.draftsService.update(id, dto, user.userId, actorRole);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft' })
  @ApiResponse({ status: 200, description: 'Draft deleted' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.remove(id, user.userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List draft versions' })
  listVersions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.listVersions(id, user.userId);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a previous version' })
  restoreVersion(@Param('id') id: string, @Body() dto: RestoreVersionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.restoreVersion(id, dto.versionId, user.userId);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export draft as txt, md, docx, or pdf' })
  @ApiQuery({ name: 'format', required: false, enum: ['txt', 'md', 'docx', 'pdf'] })
  exportDraft(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('format') format: string = 'txt',
  ) {
    const supportedFormats = ['txt', 'md', 'docx', 'pdf'] as const;
    const allowedFormats: readonly string[] = supportedFormats;
    if (!allowedFormats.includes(format)) {
      throw new BadRequestException(`Export format must be one of: ${allowedFormats.join(', ')}`);
    }

    return this.draftsService.exportDraft(id, user.userId, format as 'txt' | 'md' | 'docx' | 'pdf');
  }

  @Post(':id/export')
  @ApiOperation({ summary: 'Log a draft export event' })
  logExport(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: LogExportDto) {
    return this.draftsService.logExport(id, user.userId, dto);
  }
}
