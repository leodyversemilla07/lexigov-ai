import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTemplateDto, userId: string) {
    const template = await this.prisma.template.create({
      data: {
        name: dto.name,
        category: dto.category,
        subcategory: dto.subcategory,
        jurisdiction: dto.jurisdiction,
        structure: dto.structure as any,
        exampleContent: dto.exampleContent as any,
        isPublic: dto.isPublic ?? true,
        usageCount: 0,
        userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'templates',
        entityId: template.id,
        userId,
        changes: { name: dto.name, category: dto.category },
      },
    });

    return template;
  }

  async findAll(category?: string, publicOnly?: boolean) {
    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (publicOnly) where.isPublic = true;

    return this.prisma.template.findMany({
      where: where as any,
      orderBy: { usageCount: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    if (template.isPublic) return template;
    if (userId && template.userId === userId) return template;
    throw new NotFoundException('Template not found');
  }

  async update(id: string, dto: UpdateTemplateDto, userId: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template || template.userId !== userId) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.template.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string, userId: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template || template.userId !== userId) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.template.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'templates',
        entityId: id,
        userId,
      },
    });

    return { success: true };
  }

  async incrementUsage(id: string) {
    await this.prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }
}
