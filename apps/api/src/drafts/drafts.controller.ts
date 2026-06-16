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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
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
  create(@Body() dto: CreateDraftDto, @Req() req: any) {
    return this.draftsService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: ListDraftsDto) {
    return this.draftsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.draftsService.findOne(id, req.user.userId);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDraftDto, @Req() req: any) {
    return this.draftsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.draftsService.remove(id, req.user.userId);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string, @Req() req: any) {
    return this.draftsService.listVersions(id, req.user.userId);
  }

  @Post(':id/restore')
  restoreVersion(@Param('id') id: string, @Body() dto: RestoreVersionDto, @Req() req: any) {
    return this.draftsService.restoreVersion(id, dto.versionId, req.user.userId);
  }

  @Get(':id/export')
  exportDraft(@Param('id') id: string, @Req() req: any, @Query('format') format: string = 'txt') {
    if (format !== 'txt' && format !== 'md') {
      throw new BadRequestException('Export format must be txt or md');
    }

    return this.draftsService.exportDraft(id, req.user.userId, format);
  }

  @Post(':id/export')
  logExport(@Param('id') id: string, @Req() req: any, @Body() dto: LogExportDto) {
    return this.draftsService.logExport(id, req.user.userId, dto);
  }
}
