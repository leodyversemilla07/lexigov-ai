import {
  calculateTransmittalDeadline,
  extractDraftBody,
  getDefaultMilestones,
  legislativeMilestonesSchema,
  normalizeDraftContent,
  toJurisdictionLevel,
  validateStageTransition,
} from '@lexigov/shared';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  hasOrganizationResourceAccess,
  requireDraftWriteRole,
  resolveDraftResourceRole,
} from '../auth/organization-access';
import type { DocumentStatus } from '../common/contracts';
import { buildPaginatedResult } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDraftDto } from './dto/create-draft.dto';
import type { ListDraftsDto } from './dto/list-drafts.dto';
import type { LogExportDto } from './dto/log-export.dto';
import type { UpdateDraftDto } from './dto/update-draft.dto';

@Injectable()
export class DraftsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async getAccessibleDraft(
    prisma: Pick<Prisma.TransactionClient, 'draft' | 'member'>,
    id: string,
    userId: string,
  ) {
    const draft = await prisma.draft.findUnique({ where: { id } });
    if (!draft || !(await hasOrganizationResourceAccess(prisma, draft.organizationId, draft.userId, userId))) {
      throw new NotFoundException('Draft not found');
    }
    return draft;
  }

  async create(dto: CreateDraftDto, userId: string) {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      await requireDraftWriteRole(tx, dto.organizationId, userId);
      const draft = await tx.draft.create({
        data: {
          title: dto.title,
          documentType: dto.documentType,
          jurisdiction: dto.jurisdiction,
          jurisdictionName: dto.jurisdictionName,
          content: {
            ...normalizeDraftContent(dto.content ?? {}),
            milestones: getDefaultMilestones(),
          } as unknown as Prisma.InputJsonValue,
          status: 'DRAFT',
          aiGenerated: dto.aiGenerated ?? false,
          userId,
          organizationId: dto.organizationId ?? null,
          templateId: dto.templateId,
          version: 1,
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
    const actorRole = await resolveDraftResourceRole(this.prisma, query.organizationId, userId);

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    } else {
      // Personal scope remains owner-only. Organization records are always requested explicitly.
      where.userId = userId;
      where.organizationId = null;
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

    return buildPaginatedResult(
      data.map((draft) => ({
        ...draft,
        effectiveRole: actorRole,
        canEdit: Boolean(actorRole),
        canDelete: Boolean(actorRole) && (draft.userId === userId || actorRole === 'LGU_ADMIN'),
      })),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string, userId: string) {
    const draft = await this.getAccessibleDraft(this.prisma, id, userId);
    const actorRole = await resolveDraftResourceRole(this.prisma, draft.organizationId, userId);
    return {
      ...draft,
      effectiveRole: actorRole,
      canEdit: Boolean(actorRole),
      canDelete: Boolean(actorRole) && (draft.userId === userId || actorRole === 'LGU_ADMIN'),
    };
  }

  async update(id: string, dto: UpdateDraftDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await this.getAccessibleDraft(tx, id, userId);
      if (draft.parentDraftId) {
        throw new NotFoundException('Saved revisions are read-only');
      }

      const actorRole = await requireDraftWriteRole(tx, draft.organizationId, userId);
      if (draft.version !== dto.expectedVersion) {
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
      // Editing cannot attest enactment/publication; that requires a future verified publication workflow.
      if (nextStatus !== previousStatus && !['DRAFT', 'REVIEW', 'FINAL', 'ARCHIVED'].includes(nextStatus)) {
        throw new UnprocessableEntityException('Formal enactment and publication status cannot be set by draft editing');
      }
      const hasChange =
        nextTitle !== draft.title ||
        nextStatus !== previousStatus ||
        JSON.stringify(nextContent) !== JSON.stringify(draft.content);

      if (!hasChange) {
        return { ...draft, version: previousVersion };
      }

      const previousContent = normalizeDraftContent(draft.content);
      const previousMilestones = { ...getDefaultMilestones(), ...previousContent.milestones };
      // Omitting milestones does not erase the workflow or allow a restart of stage validation.
      const incomingMilestones = dto.content?.milestones ?? nextContent.milestones ?? previousMilestones;
      const parsedMilestones = legislativeMilestonesSchema.safeParse(incomingMilestones);
      if (!parsedMilestones.success) {
        throw new UnprocessableEntityException('Invalid legislative milestone data');
      }
      nextContent.milestones = { ...getDefaultMilestones(), ...parsedMilestones.data };
      const jurisdiction = toJurisdictionLevel(draft.jurisdiction);
      if (nextContent.milestones.transmittedDate && jurisdiction !== 'barangay') {
        nextContent.milestones.transmittalDeadline = calculateTransmittalDeadline(
          nextContent.milestones.transmittedDate,
          jurisdiction,
        );
      } else {
        delete nextContent.milestones.transmittalDeadline;
      }
      const targetStage = nextContent.milestones.currentStage;
      const validation = validateStageTransition(
        previousMilestones,
        targetStage,
        actorRole,
        jurisdiction,
        nextContent.milestones,
        draft.documentType,
      );
      if (!validation.isValid) throw new UnprocessableEntityException(validation.error);

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
          createdAt: now,
          updatedAt: draft.updatedAt,
        },
      });

      const updated = await tx.draft.update({
        where: { id, version: previousVersion },
        data: {
          title: nextTitle,
          content: nextContent as unknown as Prisma.InputJsonValue,
          status: nextStatus,
          commitMessage: dto.commitMessage,
          version: previousVersion + 1,
          updatedAt: now,
        },
      }).catch((error: unknown) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
          throw new ConflictException('Draft was modified by another session');
        }
        throw error;
      });

      const stageChanged = targetStage !== previousMilestones.currentStage;
      if (nextStatus !== previousStatus || stageChanged) {
        await tx.workflowTransition.create({
          data: {
            draftId: id,
            fromStatus: stageChanged ? previousMilestones.currentStage : previousStatus,
            toStatus: stageChanged ? targetStage : nextStatus,
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

  async remove(id: string, userId: string, expectedVersion: number) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await this.getAccessibleDraft(tx, id, userId);
      if (draft.parentDraftId) {
        throw new NotFoundException('Saved revisions cannot be deleted directly');
      }

      if (draft.version !== expectedVersion) {
        throw new ConflictException(
          `Draft was modified by another user (expected v${expectedVersion}, current is v${draft.version})`,
        );
      }

      const actorRole = await requireDraftWriteRole(tx, draft.organizationId, userId);
      if (draft.organizationId && draft.userId !== userId && actorRole !== 'LGU_ADMIN') {
        throw new ForbiddenException('Only the draft owner or an organization administrator can delete this draft');
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

  async restoreVersion(draftId: string, versionId: string, userId: string, expectedVersion: number) {
    return this.prisma.$transaction(async (tx) => {
      const draft = await this.getAccessibleDraft(tx, draftId, userId);
      if (draft.parentDraftId) {
        throw new NotFoundException('Saved revisions cannot be restored directly');
      }

      await requireDraftWriteRole(tx, draft.organizationId, userId);
      if (expectedVersion !== draft.version) {
        throw new ConflictException('Draft was modified by another session');
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
          createdAt: now,
          updatedAt: draft.updatedAt,
        },
      });

      const updated = await tx.draft.update({
        where: { id: draftId, version: draft.version },
        data: {
          title: versionDraft.title,
          content: {
            ...normalizeDraftContent(versionDraft.content),
            milestones: normalizeDraftContent(draft.content).milestones ?? getDefaultMilestones(),
          } as unknown as Prisma.InputJsonValue,
          // Restoring text must never replay historical approvals or roll back the live workflow.
          status: draft.status,
          commitMessage: `Restore version v${versionDraft.version}`,
          version: draft.version + 1,
          updatedAt: now,
        },
      }).catch((error: unknown) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
          throw new ConflictException('Draft was modified by another session');
        }
        throw error;
      });

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
            nextStatus: draft.status,
          },
          createdAt: now,
        },
      });

      return { success: true, version: updated.version, restoredFromVersion: versionDraft.version };
    });
  }

  async exportDraft(id: string, userId: string, format: 'txt' | 'md') {
    const draft = await this.findOne(id, userId);
    const content = typeof draft.content === 'string' ? draft.content : extractDraftBody(draft.content);

    const warning = 'WORKING DRAFT — NOT AN OFFICIAL RECORD\nThis export has not been authenticated or legally certified by LexiGov.\n\n';
    const header = `${draft.documentType}\n${draft.title}\n${draft.jurisdictionName} (${draft.jurisdiction})\nv${draft.version}\nStatus: ${draft.status}\n${'='.repeat(50)}\n\n`;
    const formatted =
      format === 'md'
        ? `> **WORKING DRAFT — NOT AN OFFICIAL RECORD**\n> This export has not been authenticated or legally certified by LexiGov.\n\n# ${draft.title}\n\n**Type:** ${draft.documentType}\n**Jurisdiction:** ${draft.jurisdictionName}\n**v${draft.version}**\n\n---\n\n${content}`
        : warning + header + content;

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
