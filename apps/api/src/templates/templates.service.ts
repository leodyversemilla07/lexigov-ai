import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTemplateDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.template.create({
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

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'templates',
          entityId: template.id,
          userId,
          changes: { name: dto.name, category: dto.category },
        },
      });

      return template;
    });
  }

  async findAll(userId: string, category?: string, publicOnly?: boolean) {
    const where: Record<string, unknown> = {
      ...(publicOnly ? { isPublic: true } : { OR: [{ isPublic: true }, { userId }] }),
    };

    if (category) {
      where.category = category;
    }

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
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.template.findUnique({ where: { id } });
      if (!template || template.userId !== userId) {
        throw new NotFoundException('Template not found');
      }

      const updated = await tx.template.update({
        where: { id },
        data: dto as any,
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'templates',
          entityId: id,
          userId,
          changes: dto as any,
        },
      });

      return updated;
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.template.findUnique({ where: { id } });
      if (!template || template.userId !== userId) {
        throw new NotFoundException('Template not found');
      }

      await tx.template.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'templates',
          entityId: id,
          userId,
        },
      });

      return { success: true };
    });
  }

  async incrementUsage(id: string, userId: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template || (!template.isPublic && template.userId !== userId)) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return { success: true };
  }
}
