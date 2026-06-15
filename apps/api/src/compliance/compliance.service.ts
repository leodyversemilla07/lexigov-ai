import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { analyzeDeterministicCompliance } from '../../../../packages/shared/src/compliance-analysis';
import { extractDraftBody } from '../../../../packages/shared/src/draft-content';
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

    const deterministic = analyzeDeterministicCompliance(content, draft.jurisdiction as any);

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
          issues: deterministic.issues as any,
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
