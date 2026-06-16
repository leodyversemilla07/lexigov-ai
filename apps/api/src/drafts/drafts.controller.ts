import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { ListDraftsDto } from './dto/list-drafts.dto';
import { LogExportDto } from './dto/log-export.dto';
import { RestoreVersionDto } from './dto/restore-version.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@Controller('drafts')
@UseGuards(AuthGuard)
export class DraftsController {
  constructor(@Inject(DraftsService) private readonly draftsService: DraftsService) {}

  @Post()
  create(@Body() dto: CreateDraftDto, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.create(dto, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListDraftsDto) {
    return this.draftsService.findAll(user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.findOne(id, user.userId);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDraftDto, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.remove(id, user.userId);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.listVersions(id, user.userId);
  }

  @Post(':id/restore')
  restoreVersion(@Param('id') id: string, @Body() dto: RestoreVersionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.draftsService.restoreVersion(id, dto.versionId, user.userId);
  }

  @Get(':id/export')
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
  logExport(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: LogExportDto) {
    return this.draftsService.logExport(id, user.userId, dto);
  }
}
