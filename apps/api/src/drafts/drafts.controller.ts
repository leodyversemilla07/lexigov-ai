import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { ListDraftsDto } from './dto/list-drafts.dto';
import { LogExportDto } from './dto/log-export.dto';
import { RestoreVersionDto } from './dto/restore-version.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@ApiTags('Drafts')
@ApiBearerAuth()
@Controller('drafts')
@UseGuards(AuthGuard)
export class DraftsController {
  constructor(@Inject(DraftsService) private readonly draftsService: DraftsService) {}

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
  update(@Param('id') id: string, @Body() dto: UpdateDraftDto, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.update(id, dto, user.userId);
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
  @ApiOperation({ summary: 'Export draft as txt or md' })
  @ApiQuery({ name: 'format', required: false, enum: ['txt', 'md'] })
  exportDraft(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('format') format: string = 'txt',
  ) {
    if (format !== 'txt' && format !== 'md') {
      throw new BadRequestException('Export format must be txt or md');
    }

    return this.draftsService.exportDraft(id, user.userId, format);
  }

  @Post(':id/export')
  @ApiOperation({ summary: 'Log a draft export event' })
  logExport(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: LogExportDto) {
    return this.draftsService.logExport(id, user.userId, dto);
  }
}
