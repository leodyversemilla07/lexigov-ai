import { analyzeDeterministicCompliance, extractDraftBody } from '@lexigov/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { isJurisdictionLevel } from '../common/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async checkDraft(draftId: string, userId: string) {
    const draft = await this.prisma.draft.findFirst({
      where: { id: draftId, userId },
    });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    const content = typeof draft.content === 'string' ? draft.content : extractDraftBody(draft.content);

    // Mirror AiService behaviour: skip deterministic analysis (and do not
    // persist a misleading report) when the jurisdiction is not one of the
    // four RA 7160 levels. Previously this silently coerced to 'barangay'.
    if (!isJurisdictionLevel(draft.jurisdiction)) {
      return { overallScore: 0, isValid: false, issues: [] as never[] } as const;
    }

    const deterministic = analyzeDeterministicCompliance(content, draft.jurisdiction);

    await this.prisma.$transaction(async (tx) => {
      const report = await tx.complianceReport.create({
        data: {
          draftId,
          draftVersion: draft.version,
          overallScore: deterministic.overallScore,
          isValid: deterministic.isValid,
          issuesCount: deterministic.issues.length,
          warningsCount: deterministic.issues.filter((i) => i.type === 'warning').length,
          suggestionsCount: deterministic.issues.filter((i) => i.type === 'suggestion').length,
          issues: deterministic.issues as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CHECK_COMPLIANCE',
          entityType: 'drafts',
          entityId: draftId,
          userId,
          changes: {
            complianceReportId: report.id,
            draftVersion: draft.version,
            overallScore: deterministic.overallScore,
          },
        },
      });
    });

    return deterministic;
  }

  async getReports(draftId: string, userId: string) {
    const draft = await this.prisma.draft.findFirst({
      where: { id: draftId, userId },
    });
    if (!draft) return [];

    return this.prisma.complianceReport.findMany({
      where: { draftId },
      orderBy: { checkedAt: 'desc' },
      take: 10,
    });
  }
}
