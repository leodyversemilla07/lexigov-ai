import { Body, Controller, Delete, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(AuthGuard)
export class TemplatesController {
  constructor(@Inject(TemplatesService) private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.create(dto, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListTemplatesDto) {
    return this.templatesService.findAll(user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.findOne(id, user.userId);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.update(id, dto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.remove(id, user.userId);
  }

  @Post(':id/usage')
  incrementUsage(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.incrementUsage(id, user.userId);
  }
}
