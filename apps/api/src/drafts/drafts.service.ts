import { extractDraftBody, normalizeDraftContent } from '@lexigov/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateDraftDto } from './dto/create-draft.dto';
import type { UpdateDraftDto } from './dto/update-draft.dto';

@Injectable()
export class DraftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDraftDto, userId: string) {
    const now = new Date();
    const draft = await this.prisma.draft.create({
      data: {
        title: dto.title,
        documentType: dto.documentType,
        jurisdiction: dto.jurisdiction,
        jurisdictionName: dto.jurisdictionName,
        content: normalizeDraftContent(dto.content ?? {}),
        status: 'DRAFT',
        aiGenerated: dto.aiGenerated ?? false,
        userId,
        templateId: dto.templateId,
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'drafts',
        entityId: draft.id,
        userId,
        createdAt: now,
      },
    });

    return draft;
  }

  async findAll(userId: string, status?: string) {
    const where: Record<string, unknown> = { userId, parentDraftId: null };
    if (status) where.status = status;

    return this.prisma.draft.findMany({
      where: where as any,
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string, userId: string) {
    const draft = await this.prisma.draft.findFirst({
      where: { id, userId },
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return draft;
  }

  async update(id: string, dto: UpdateDraftDto, userId: string) {
    const draft = await this.findOne(id, userId);
    if (draft.parentDraftId) {
      throw new NotFoundException('Saved revisions are read-only');
    }

    const now = new Date();
    const nextTitle = dto.title ?? draft.title;
    const nextContent = normalizeDraftContent(dto.content ?? draft.content);
    const nextStatus = dto.status ?? draft.status;

    const hasChange =
      nextTitle !== draft.title ||
      nextStatus !== draft.status ||
      JSON.stringify(nextContent) !== JSON.stringify(draft.content);

    if (!hasChange) {
      return { ...draft, version: draft.version };
    }

    await this.prisma.draft.create({
      data: {
        title: draft.title,
        documentType: draft.documentType,
        jurisdiction: draft.jurisdiction,
        jurisdictionName: draft.jurisdictionName,
        content: draft.content as any,
        status: draft.status,
        aiGenerated: draft.aiGenerated,
        userId: draft.userId,
        templateId: draft.templateId,
        version: draft.version,
        parentDraftId: draft.id,
        commitMessage: draft.commitMessage,
        createdAt: now,
        updatedAt: draft.updatedAt,
      },
    });

    const updated = await this.prisma.draft.update({
      where: { id },
      data: {
        title: nextTitle,
        content: nextContent as any,
        status: nextStatus,
        commitMessage: dto.commitMessage,
        version: draft.version + 1,
        updatedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'drafts',
        entityId: id,
        userId,
        changes: {
          previousVersion: draft.version,
          nextVersion: draft.version + 1,
        },
        createdAt: now,
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const draft = await this.findOne(id, userId);
    if (draft.parentDraftId) {
      throw new NotFoundException('Saved revisions cannot be deleted directly');
    }

    await this.prisma.draft.deleteMany({ where: { parentDraftId: id } });
    await this.prisma.complianceReport.deleteMany({ where: { draftId: id } });
    await this.prisma.exportHistory.deleteMany({ where: { draftId: id } });
    await this.prisma.draft.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'drafts',
        entityId: id,
        userId,
        createdAt: new Date(),
      },
    });

    return { success: true };
  }

  async listVersions(draftId: string, userId: string) {
    const draft = await this.findOne(draftId, userId);
    const rootId = draft.parentDraftId ?? draft.id;

    const revisions = await this.prisma.draft.findMany({
      where: { parentDraftId: rootId },
      orderBy: { version: 'desc' },
    });

    const root = await this.prisma.draft.findUnique({ where: { id: rootId } });
    const all = root ? [...revisions, root] : revisions;
    all.sort((a, b) => b.version - a.version);

    return all.map((v) => ({
      id: v.id,
      title: v.title,
      status: v.status,
      version: v.version,
      updatedAt: v.updatedAt,
      createdAt: v.createdAt,
      commitMessage: v.commitMessage,
      isCurrent: v.id === rootId,
      body: extractDraftBody(v.content),
    }));
  }

  async restoreVersion(draftId: string, versionId: string, userId: string) {
    const draft = await this.findOne(draftId, userId);
    if (draft.parentDraftId) {
      throw new NotFoundException('Saved revisions cannot be restored directly');
    }

    const versionDraft = await this.prisma.draft.findFirst({
      where: { id: versionId, OR: [{ id: draftId }, { parentDraftId: draftId }] },
    });
    if (!versionDraft) {
      throw new NotFoundException('Version not found');
    }

    if (versionDraft.id === draftId) {
      return { success: true, version: draft.version };
    }

    const now = new Date();

    await this.prisma.draft.create({
      data: {
        title: draft.title,
        documentType: draft.documentType,
        jurisdiction: draft.jurisdiction,
        jurisdictionName: draft.jurisdictionName,
        content: draft.content as any,
        status: draft.status,
        aiGenerated: draft.aiGenerated,
        userId: draft.userId,
        templateId: draft.templateId,
        version: draft.version,
        parentDraftId: draft.id,
        commitMessage: draft.commitMessage,
        createdAt: now,
        updatedAt: draft.updatedAt,
      },
    });

    const updated = await this.prisma.draft.update({
      where: { id: draftId },
      data: {
        title: versionDraft.title,
        content: versionDraft.content as any,
        status: versionDraft.status,
        commitMessage: `Restore version v${versionDraft.version}`,
        version: draft.version + 1,
        updatedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'RESTORE_VERSION',
        entityType: 'drafts',
        entityId: draftId,
        userId,
        changes: {
          previousVersion: draft.version,
          nextVersion: draft.version + 1,
          restoredFromVersion: versionDraft.version,
        },
        createdAt: now,
      },
    });

    return { success: true, version: updated.version, restoredFromVersion: versionDraft.version };
  }

  async exportDraft(id: string, userId: string, format: 'txt' | 'md') {
    const draft = await this.findOne(id, userId);
    const content = typeof draft.content === 'string' ? draft.content : extractDraftBody(draft.content);

    const header = `${draft.documentType}\n${draft.title}\n${draft.jurisdictionName} (${draft.jurisdiction})\nv${draft.version}\nStatus: ${draft.status}\n${'='.repeat(50)}\n\n`;
    const formatted =
      format === 'md'
        ? `# ${draft.title}\n\n**Type:** ${draft.documentType}\n**Jurisdiction:** ${draft.jurisdictionName}\n**v${draft.version}**\n\n---\n\n${content}`
        : header + content;

    await this.prisma.exportHistory.create({
      data: {
        draftId: id,
        exportType: format.toUpperCase(),
        exportedBy: userId,
        createdAt: new Date(),
      },
    });

    return {
      filename: `${draft.title.replace(/[^a-z0-9]/gi, '_')}_v${draft.version}.${format}`,
      content: formatted,
      mimeType: format === 'md' ? 'text/markdown' : 'text/plain',
    };
  }
}
