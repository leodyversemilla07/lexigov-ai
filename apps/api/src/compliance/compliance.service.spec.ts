import type { ComplianceResult } from '@lexigov/shared';
import { ComplianceService } from './compliance.service';

interface DraftRecord {
  id: string;
  userId: string;
  jurisdiction: string;
  content: unknown;
  version: number;
}

interface ComplianceReportRecord {
  id: string;
  draftId: string;
  draftVersion: number;
  overallScore: number;
  isValid: boolean;
  issuesCount: number;
  warningsCount: number;
  suggestionsCount: number;
  issues: unknown;
  checkedAt: Date;
}

interface PrismaDouble {
  draft: { findFirst: jest.Mock };
  complianceReport: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  auditLog: { create: jest.Mock };
  $transaction: jest.Mock;
  state: {
    drafts: Map<string, DraftRecord>;
    reports: ComplianceReportRecord[];
    auditLogs: Array<{ action: string; entityId: string; userId: string; changes?: unknown }>;
  };
}

function buildPrismaDouble(): PrismaDouble {
  const drafts = new Map<string, DraftRecord>();
  const reports: ComplianceReportRecord[] = [];
  const auditLogs: Array<{ action: string; entityId: string; userId: string; changes?: unknown }> = [];

  const draft = {
    findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      return (
        Array.from(drafts.values()).find((d) =>
          Object.entries(where).every(([k, v]) => (d as unknown as Record<string, unknown>)[k] === v),
        ) ?? null
      );
    }),
  };

  const complianceReport = {
    create: jest.fn(async ({ data }: { data: Omit<ComplianceReportRecord, 'id' | 'checkedAt'> }) => {
      const record: ComplianceReportRecord = {
        id: `report_${reports.length + 1}`,
        checkedAt: new Date(),
        ...data,
      };
      reports.push(record);
      return record;
    }),
    findMany: jest.fn(
      async ({
        where,
        orderBy,
        take,
      }: {
        where: { draftId: string };
        orderBy?: { checkedAt?: 'asc' | 'desc' };
        take?: number;
      }) => {
        let results = reports.filter((r) => r.draftId === where.draftId);
        if (orderBy?.checkedAt) {
          results = results.sort((a, b) =>
            orderBy.checkedAt === 'desc'
              ? b.checkedAt.getTime() - a.checkedAt.getTime()
              : a.checkedAt.getTime() - b.checkedAt.getTime(),
          );
        }
        return take ? results.slice(0, take) : results;
      },
    ),
  };

  const auditLog = {
    create: jest.fn(
      async ({ data }: { data: { action: string; entityId: string; userId: string; changes?: unknown } }) => {
        auditLogs.push(data);
        return data;
      },
    ),
  };

  const tx = { draft, complianceReport, auditLog };

  return {
    ...tx,
    $transaction: jest.fn(async <T>(callback: (transaction: typeof tx) => Promise<T>) => callback(tx)),
    state: { drafts, reports, auditLogs },
  };
}

function buildService() {
  const prisma = buildPrismaDouble();
  const service = new ComplianceService(prisma as unknown as ConstructorParameters<typeof ComplianceService>[0]);
  return { service, prisma };
}

function expectSuccess(result: ComplianceResult): asserts result is ComplianceResult {
  expect(result).toHaveProperty('overallScore');
  expect(result).toHaveProperty('isValid');
  expect(result).toHaveProperty('issues');
}

const wellFormedBarangay = [
  'Republic of the Philippines',
  'Province of Sample',
  'Municipality of Sample',
  'Barangay San Roque',
  'WHEREAS, public safety requires regulation.',
  'SECTION 1. Title.',
  'This ordinance shall be known as the Sample Ordinance.',
  'SECTION 2. Penalties.',
  'Any violator shall pay a fine of P500.00.',
  'SECTION 3. Separability Clause.',
  'If any portion is invalid, the rest remains effective.',
  'SECTION 4. Repealing Clause.',
  'Inconsistent ordinances are repealed.',
  'SECTION 5. Effectivity Clause.',
  'This ordinance shall take effect after posting and publication.',
].join('\n');

describe('ComplianceService.checkDraft', () => {
  it('throws NotFoundException when the draft does not exist or does not belong to the user', async () => {
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_other_user', {
      id: 'draft_other_user',
      userId: 'someone_else',
      jurisdiction: 'barangay',
      content: { body: 'irrelevant' },
      version: 1,
    });

    await expect(service.checkDraft('draft_other_user', 'user_1')).rejects.toThrow('Draft not found');
    expect(prisma.state.reports).toHaveLength(0);
    expect(prisma.state.auditLogs).toHaveLength(0);
  });

  it('throws NotFoundException when the draft id is not in the database at all', async () => {
    const { service, prisma } = buildService();

    await expect(service.checkDraft('nonexistent', 'user_1')).rejects.toThrow('Draft not found');
    expect(prisma.state.reports).toHaveLength(0);
  });

  it('throws NotFoundException when the draft belongs to a different user', async () => {
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_other_user', {
      id: 'draft_other_user',
      userId: 'someone_else',
      jurisdiction: 'barangay',
      content: { body: 'irrelevant' },
      version: 1,
    });

    await expect(service.checkDraft('draft_other_user', 'user_1')).rejects.toThrow('Draft not found');
    expect(prisma.state.auditLogs).toHaveLength(0);
  });

  it('runs deterministic analysis, persists a report, and writes an audit log entry', async () => {
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_1', {
      id: 'draft_1',
      userId: 'user_1',
      jurisdiction: 'barangay',
      content: { body: wellFormedBarangay },
      version: 3,
    });

    const result = await service.checkDraft('draft_1', 'user_1');
    expectSuccess(result);

    expect(result.isValid).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);

    expect(prisma.state.reports).toHaveLength(1);
    const report = prisma.state.reports[0];
    expect(report).toBeDefined();
    expect(report).toMatchObject({
      draftId: 'draft_1',
      draftVersion: 3,
      isValid: true,
    });
    expect(report?.issuesCount).toBe(result.issues.length);

    expect(prisma.state.auditLogs).toEqual([
      expect.objectContaining({
        action: 'CHECK_COMPLIANCE',
        entityId: 'draft_1',
        userId: 'user_1',
        changes: expect.objectContaining({
          complianceReportId: report?.id,
          draftVersion: 3,
          overallScore: result.overallScore,
        }),
      }),
    ]);
  });

  it('handles a draft whose content is stored as a plain string', async () => {
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_string', {
      id: 'draft_string',
      userId: 'user_1',
      jurisdiction: 'barangay',
      content: 'SECTION 1. A barebones ordinance.',
      version: 1,
    });

    const result = await service.checkDraft('draft_string', 'user_1');
    expectSuccess(result);

    expect(Array.isArray(result.issues)).toBe(true);
    expect(prisma.state.reports).toHaveLength(1);
  });

  it('flags missing sections in a short, badly-structured draft', async () => {
    // Seed a real draft with very short, unstructured content
    const prisma = buildPrismaDouble();
    prisma.state.drafts.set('draft_bad', {
      id: 'draft_bad',
      userId: 'user_1',
      jurisdiction: 'municipal',
      content: { body: 'Too short and unstructured.' },
      version: 1,
    });
    const serviceWithDraft = new ComplianceService(
      prisma as unknown as ConstructorParameters<typeof ComplianceService>[0],
    );

    const result = await serviceWithDraft.checkDraft('draft_bad', 'user_1');
    expectSuccess(result);

    expect(result.isValid).toBe(false);
    // Should have at least one critical issue (e.g., missing sections, missing effectivity)
    expect(result.issues.some((i) => i.type === 'critical')).toBe(true);
  });

  it('treats a null/missing content as empty body and still runs the analyzer', async () => {
    // The extractDraftBody helper returns '' for null/numbers/arrays, which
    // then flows through analyzeDeterministicCompliance. The result should be
    // a well-formed empty ComplianceResult (not a thrown error).
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_null', {
      id: 'draft_null',
      userId: 'user_1',
      jurisdiction: 'barangay',
      content: null,
      version: 1,
    });

    const result = await service.checkDraft('draft_null', 'user_1');
    expectSuccess(result);

    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
    // Empty content misses the structural checks
    expect(result.isValid).toBe(false);
    expect(prisma.state.reports).toHaveLength(1);
  });

  it('extracts body from an object content that lacks a body field', async () => {
    // An object with no .body field is treated as empty content.
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_no_body', {
      id: 'draft_no_body',
      userId: 'user_1',
      jurisdiction: 'barangay',
      content: { summary: 'just a summary, no body' },
      version: 1,
    });

    const result = await service.checkDraft('draft_no_body', 'user_1');
    expectSuccess(result);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe('ComplianceService.getReports', () => {
  it('returns an empty list when the draft does not belong to the user', async () => {
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_other', {
      id: 'draft_other',
      userId: 'someone_else',
      jurisdiction: 'barangay',
      content: {},
      version: 1,
    });

    const result = await service.getReports('draft_other', 'user_1');

    expect(result).toEqual([]);
  });

  it('returns an empty list when the draft id is not in the database', async () => {
    const { service } = buildService();
    const result = await service.getReports('nonexistent', 'user_1');
    expect(result).toEqual([]);
  });

  it('returns the most recent reports for the draft, ordered by checkedAt desc', async () => {
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_1', {
      id: 'draft_1',
      userId: 'user_1',
      jurisdiction: 'barangay',
      content: {},
      version: 1,
    });

    // Generate two reports by running checkDraft twice
    await service.checkDraft('draft_1', 'user_1');
    // Force a different checkedAt by waiting briefly
    await new Promise((resolve) => setTimeout(resolve, 5));
    await service.checkDraft('draft_1', 'user_1');

    const reports = await service.getReports('draft_1', 'user_1');

    expect(reports).toHaveLength(2);
    // Most recent first
    const [first, second] = reports;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first?.checkedAt.getTime()).toBeGreaterThanOrEqual(second?.checkedAt.getTime() ?? 0);
  });

  it('respects the take=10 limit on returned reports', async () => {
    const { service, prisma } = buildService();
    prisma.state.drafts.set('draft_1', {
      id: 'draft_1',
      userId: 'user_1',
      jurisdiction: 'barangay',
      content: {},
      version: 1,
    });

    // Generate 12 reports
    for (let i = 0; i < 12; i++) {
      const draft = prisma.state.drafts.get('draft_1');
      if (draft) draft.version = i + 1;
      await service.checkDraft('draft_1', 'user_1');
    }

    const reports = await service.getReports('draft_1', 'user_1');

    expect(reports).toHaveLength(10);
  });
});
