import { Body, Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(AuthGuard)
export class TemplatesController {
  constructor(@Inject(TemplatesService) private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req: any) {
    return this.templatesService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: ListTemplatesDto) {
    return this.templatesService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.templatesService.findOne(id, req.user?.userId);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @Req() req: any) {
    return this.templatesService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.templatesService.remove(id, req.user.userId);
  }

  @Post(':id/usage')
  incrementUsage(@Param('id') id: string, @Req() req: any) {
    return this.templatesService.incrementUsage(id, req.user.userId);
  }
}
