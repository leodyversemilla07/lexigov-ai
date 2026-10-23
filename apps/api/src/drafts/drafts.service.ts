import {
  buildDefaultDocumentFormatConfig,
  extractDraftBody,
  type FormattedDocumentData,
  getDefaultMilestones,
  normalizeDraftContent,
  type SanggunianRole,
  toJurisdictionLevel,
  validateStageTransition,
} from '@lexigov/shared';
import { ConflictException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { ARTIFACT_STORAGE } from '../artifacts/artifact.module';
import type { ArtifactStorage } from '../artifacts/artifact-storage.service';
import type { DocumentStatus } from '../common/contracts';
import { buildPaginatedResult } from '../common/pagination';
import { OfficialDocumentExportService } from '../exports/official-document-export.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDraftDto } from './dto/create-draft.dto';
import type { ListDraftsDto } from './dto/list-drafts.dto';
import type { LogExportDto } from './dto/log-export.dto';
import type { UpdateDraftDto } from './dto/update-draft.dto';

@Injectable()
export class DraftsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ARTIFACT_STORAGE) private readonly artifactStorage: ArtifactStorage,
    @Inject(OfficialDocumentExportService) private readonly officialExportService: OfficialDocumentExportService,
  ) {}

  async create(dto: CreateDraftDto, userId: string) {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.draft.create({
        data: {
          title: dto.title,
          documentType: dto.documentType,
          jurisdiction: dto.jurisdiction,
          jurisdictionName: dto.jurisdictionName,
          content: normalizeDraftContent(dto.content ?? {}) as unknown as Prisma.InputJsonValue,
          status: 'DRAFT',
          aiGenerated: dto.aiGenerated ?? false,
          userId,
          organizationId: dto.organizationId ?? null,
          templateId: dto.templateId,
          version: 1,
          documentHash: dto.documentHash ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'drafts',
          entityId: draft.id,
          userId,
          createdAt: now,
        },
      });

      return draft;
    });
  }

  async findAll(userId: string, queryOrStatus: ListDraftsDto | DocumentStatus = {}) {
    const query = typeof queryOrStatus === 'string' ? { status: queryOrStatus } : queryOrStatus;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Record<string, unknown> = { parentDraftId: null };

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    } else {
      where.userId = userId;
    }

    if (query.status) where.status = query.status;
    if (query.documentType) where.documentType = query.documentType;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { jurisdictionName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.draft.findMany({
        where: where as Prisma.DraftWhereInput,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.draft.count({ where: where as Prisma.DraftWhereInput }),
    ]);

    return buildPaginatedResult(data, page, limit, total);
  }

  async findOne(id: string, userId: string) {
    const draft = await this.prisma.draft.findFirst({
      where: { id, userId },
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return draft;
  }

  async update(id: string, dto: UpdateDraftDto, userId: string, actorRole: SanggunianRole = 'LEGISLATIVE_STAFF') {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.draft.findFirst({
        where: { id, userId },
      });
      if (!draft) throw new NotFoundException('Draft not found');
      if (draft.parentDraftId) {
        throw new NotFoundException('Saved revisions are read-only');
      }

      if (dto.expectedVersion !== undefined && draft.version !== dto.expectedVersion) {
        throw new ConflictException(
          `Draft was modified by another user (expected v${dto.expectedVersion}, current is v${draft.version})`,
        );
      }

      const now = new Date();
      const previousStatus = draft.status;
      const previousVersion = draft.version;
      const nextTitle = dto.title ?? draft.title;
      const nextContent = normalizeDraftContent(dto.content ?? draft.content);
      const nextStatus = dto.status ?? draft.status;
      const nextDocumentHash = dto.documentHash ?? draft.documentHash;

      const hasChange =
        nextTitle !== draft.title ||
        nextStatus !== previousStatus ||
        nextDocumentHash !== draft.documentHash ||
        JSON.stringify(nextContent) !== JSON.stringify(draft.content);

      if (!hasChange) {
        return { ...draft, version: previousVersion };
      }

      const previousContent = normalizeDraftContent(draft.content);
      const previousMilestones = previousContent.milestones;
      const previousStage = previousMilestones?.currentStage ?? previousStatus;
      const targetStage = nextContent.milestones?.currentStage;

      if (targetStage && targetStage !== previousMilestones?.currentStage) {
        const validation = validateStageTransition(
          previousMilestones || getDefaultMilestones(),
          targetStage,
          actorRole,
          toJurisdictionLevel(draft.jurisdiction),
        );
        if (!validation.isValid) {
          throw new UnprocessableEntityException(validation.error);
        }
      }

      await tx.draft.create({
        data: {
          title: draft.title,
          documentType: draft.documentType,
          jurisdiction: draft.jurisdiction,
          jurisdictionName: draft.jurisdictionName,
          content: draft.content as unknown as Prisma.InputJsonValue,
          status: previousStatus,
          aiGenerated: draft.aiGenerated,
          userId: draft.userId,
          organizationId: draft.organizationId,
          templateId: draft.templateId,
          version: previousVersion,
          parentDraftId: draft.id,
          commitMessage: draft.commitMessage,
          documentHash: draft.documentHash,
          createdAt: now,
          updatedAt: draft.updatedAt,
        },
      });

      const nextWorkflowStatus = targetStage ?? nextStatus;
      const stageChanged = nextWorkflowStatus !== previousStage;
      const statusChanged = nextStatus !== previousStatus;
      const effectiveStatus = stageChanged ? nextWorkflowStatus : nextStatus;

      const updated = await tx.draft.update({
        where: { id },
        data: {
          title: nextTitle,
          content: nextContent as unknown as Prisma.InputJsonValue,
          status: effectiveStatus,
          commitMessage: dto.commitMessage,
          documentHash: nextDocumentHash,
          version: previousVersion + 1,
          updatedAt: now,
        },
      });

      if (stageChanged || statusChanged) {
        await tx.workflowTransition.create({
          data: {
            draftId: id,
            fromStatus: previousStage,
            toStatus: stageChanged ? nextWorkflowStatus : nextStatus,
            actorId: userId,
            remarks: dto.commitMessage ?? (actorRole ? `Stage updated by ${actorRole}` : null),
            createdAt: now,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'drafts',
          entityId: id,
          userId,
          changes: {
            previousVersion,
            nextVersion: previousVersion + 1,
            previousStatus,
            nextStatus,
          },
          createdAt: now,
        },
      });

      return updated;
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.draft.findFirst({
        where: { id, userId },
      });
      if (!draft) throw new NotFoundException('Draft not found');
      if (draft.parentDraftId) {
        throw new NotFoundException('Saved revisions cannot be deleted directly');
      }

      const revisions = await tx.draft.findMany({
        where: { parentDraftId: id },
      });
      const relatedDraftIds = [id, ...revisions.map((revision) => revision.id)];

      await tx.complianceReport.deleteMany({ where: { draftId: { in: relatedDraftIds } } });
      await tx.exportHistory.deleteMany({ where: { draftId: { in: relatedDraftIds } } });
      await tx.draft.deleteMany({ where: { parentDraftId: id } });
      await tx.draft.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'drafts',
          entityId: id,
          userId,
          createdAt: new Date(),
        },
      });

      return { success: true };
    });
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
    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.draft.findFirst({
        where: { id: draftId, userId },
      });
      if (!draft) throw new NotFoundException('Draft not found');
      if (draft.parentDraftId) {
        throw new NotFoundException('Saved revisions cannot be restored directly');
      }

      const versionDraft = await tx.draft.findFirst({
        where: { id: versionId, OR: [{ id: draftId }, { parentDraftId: draftId }] },
      });
      if (!versionDraft) {
        throw new NotFoundException('Version not found');
      }

      if (versionDraft.id === draftId) {
        return { success: true, version: draft.version };
      }

      const now = new Date();

      await tx.draft.create({
        data: {
          title: draft.title,
          documentType: draft.documentType,
          jurisdiction: draft.jurisdiction,
          jurisdictionName: draft.jurisdictionName,
          content: draft.content as Prisma.InputJsonValue,
          status: draft.status,
          aiGenerated: draft.aiGenerated,
          userId: draft.userId,
          organizationId: draft.organizationId,
          templateId: draft.templateId,
          version: draft.version,
          parentDraftId: draft.id,
          commitMessage: draft.commitMessage,
          documentHash: draft.documentHash,
          createdAt: now,
          updatedAt: draft.updatedAt,
        },
      });

      const updated = await tx.draft.update({
        where: { id: draftId },
        data: {
          title: versionDraft.title,
          content: versionDraft.content as Prisma.InputJsonValue,
          status: versionDraft.status,
          commitMessage: `Restore version v${versionDraft.version}`,
          documentHash: versionDraft.documentHash,
          version: draft.version + 1,
          updatedAt: now,
        },
      });

      if (versionDraft.status !== draft.status) {
        await tx.workflowTransition.create({
          data: {
            draftId,
            fromStatus: draft.status,
            toStatus: versionDraft.status,
            actorId: userId,
            remarks: `Restored to v${versionDraft.version}`,
            createdAt: now,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'RESTORE_VERSION',
          entityType: 'drafts',
          entityId: draftId,
          userId,
          changes: {
            previousVersion: draft.version,
            nextVersion: draft.version + 1,
            restoredFromVersion: versionDraft.version,
            previousStatus: draft.status,
            nextStatus: versionDraft.status,
          },
          createdAt: now,
        },
      });

      return { success: true, version: updated.version, restoredFromVersion: versionDraft.version };
    });
  }

  async exportDraft(id: string, userId: string, format: 'txt' | 'md' | 'docx' | 'pdf') {
    const draft = await this.findOne(id, userId);
    const content = typeof draft.content === 'string' ? draft.content : extractDraftBody(draft.content);

    if (format === 'docx' || format === 'pdf') {
      const documentData: FormattedDocumentData = {
        title: draft.title,
        enactmentNumber: '2026-___',
        documentType: draft.documentType,
        jurisdiction: toJurisdictionLevel(draft.jurisdiction),
        jurisdictionName: draft.jurisdictionName,
        body: content,
        verificationHash: draft.documentHash || `LXG-${draft.id.slice(0, 8).toUpperCase()}`,
        verificationUrl: `https://lexigov.ph/verify?id=${draft.id}`,
        version: draft.version,
      };
      const config = buildDefaultDocumentFormatConfig(
        toJurisdictionLevel(draft.jurisdiction),
        draft.jurisdictionName,
        getDefaultMilestones(),
      );
      const buffer =
        format === 'docx'
          ? await this.officialExportService.generateOfficialDocx(documentData, config)
          : await this.officialExportService.generateOfficialPdf(documentData, config);
      const mimeType =
        format === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf';
      const artifactKey = `exports/${draft.id}/v${draft.version}.${format}`;
      const artifactUrl = await this.artifactStorage.put(artifactKey, buffer, mimeType);
      const filename = `${draft.title.replace(/[^a-z0-9]/gi, '_')}_official.${format}`;

      await this.prisma.exportHistory.create({
        data: {
          draftId: id,
          exportType: format.toUpperCase(),
          exportedBy: userId,
          createdAt: new Date(),
        },
      });

      return {
        filename,
        mimeType,
        artifactKey,
        artifactUrl,
      };
    }

    const header = `${draft.documentType}\n${draft.title}\n${draft.jurisdictionName} (${draft.jurisdiction})\nv${draft.version}\nStatus: ${draft.status}\n${'='.repeat(50)}\n\n`;
    const formatted =
      format === 'md'
        ? `# ${draft.title}\n\n**Type:** ${draft.documentType}\n**Jurisdiction:** ${draft.jurisdictionName}\n**v${draft.version}**\n\n---\n\n${content}`
        : header + content;

    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    const artifactKey = `exports/${draft.id}/v${draft.version}.${format}`;
    const artifactUrl = await this.artifactStorage.put(artifactKey, Buffer.from(formatted, 'utf-8'), mimeType);

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
      mimeType,
      artifactKey,
      artifactUrl,
    };
  }

  async logExport(id: string, userId: string, dto: LogExportDto) {
    const draft = await this.findOne(id, userId);

    await this.prisma.exportHistory.create({
      data: {
        draftId: draft.id,
        exportType: dto.format.toUpperCase(),
        fileSize: dto.fileSize,
        pageCount: dto.pageCount,
        exportedBy: userId,
        createdAt: new Date(),
      },
    });

    return { success: true };
  }
}
