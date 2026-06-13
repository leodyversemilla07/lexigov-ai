import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import type { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(AuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req: any) {
    return this.templatesService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any, @Query('category') category?: string, @Query('publicOnly') publicOnly?: string) {
    return this.templatesService.findAll(req.user.userId, category, publicOnly === 'true');
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
