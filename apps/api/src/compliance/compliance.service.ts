import { analyzeDeterministicCompliance, extractDraftBody } from '@lexigov/shared';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDraft(draftId: string, userId: string) {
    const draft = await this.prisma.draft.findFirst({
      where: { id: draftId, userId },
    });
    if (!draft) {
      return { error: 'Draft not found' };
    }

    const content = typeof draft.content === 'string' ? draft.content : extractDraftBody(draft.content);

    const deterministic = analyzeDeterministicCompliance(content, draft.jurisdiction as any);

    const report = await this.prisma.complianceReport.create({
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

    await this.prisma.auditLog.create({
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
