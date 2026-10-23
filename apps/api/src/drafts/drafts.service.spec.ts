import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InMemoryArtifactStorage } from '../artifacts/artifact-storage.service';
import { OfficialDocumentExportService } from '../exports/official-document-export.service';
import { DraftsService } from './drafts.service';
import type { CreateDraftDto } from './dto/create-draft.dto';
import type { LogExportDto } from './dto/log-export.dto';
import type { UpdateDraftDto } from './dto/update-draft.dto';

/**
 * Minimal Prisma double for DraftsService.
 * Tracks calls and returns whatever the test sets. Implements only the methods
 * DraftsService calls, so the test breaks if the service starts using new ones.
 */
interface DraftRecord {
  id: string;
  title: string;
  documentType: string;
  jurisdiction: string;
  jurisdictionName: string;
  content: unknown;
  status: string;
  aiGenerated: boolean;
  userId: string;
  organizationId?: string | null;
  templateId?: string | null;
  version: number;
  parentDraftId?: string | null;
  commitMessage?: string | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function buildPrismaDouble() {
  const drafts = new Map<string, DraftRecord>();
  const auditLogs: Array<{ action: string; entityType: string; entityId: string; userId: string }> = [];
  const exportHistory: Array<{ draftId: string; exportType: string; exportedBy: string }> = [];
  const workflowTransitions: Array<{ draftId: string; fromStatus: string; toStatus: string; actorId: string }> = [];

  const draft = {
    create: jest.fn(async ({ data }: { data: Partial<DraftRecord> }) => {
      const id = data.id ?? `draft_${drafts.size + 1}`;
      const record: DraftRecord = {
        id,
        title: data.title ?? 'Untitled',
        documentType: data.documentType ?? 'ORDINANCE',
        jurisdiction: data.jurisdiction ?? 'barangay',
        jurisdictionName: data.jurisdictionName ?? 'LGU',
        content: data.content ?? {},
        status: data.status ?? 'DRAFT',
        aiGenerated: data.aiGenerated ?? false,
        userId: data.userId ?? 'user_1',
        organizationId: data.organizationId ?? null,
        templateId: data.templateId ?? null,
        version: data.version ?? 1,
        parentDraftId: data.parentDraftId ?? null,
        commitMessage: data.commitMessage ?? null,
        deletedAt: data.deletedAt ?? null,
        deletedBy: data.deletedBy ?? null,
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      };
      drafts.set(id, record);
      return record;
    }),
    findMany: jest.fn(
      async ({
        where,
        orderBy,
        skip,
        take,
      }: {
        where?: Record<string, unknown>;
        orderBy?: { updatedAt?: 'asc' | 'desc'; version?: 'asc' | 'desc' };
        skip?: number;
        take?: number;
      }) => {
        let results = Array.from(drafts.values());
        if (where) {
          results = results.filter((d) =>
            Object.entries(where).every(([k, v]) => (d as unknown as Record<string, unknown>)[k] === v),
          );
        }
        if (orderBy?.updatedAt) {
          results.sort((a, b) =>
            orderBy.updatedAt === 'desc'
              ? b.updatedAt.getTime() - a.updatedAt.getTime()
              : a.updatedAt.getTime() - b.updatedAt.getTime(),
          );
        } else if (orderBy?.version) {
          results.sort((a, b) => (orderBy.version === 'desc' ? b.version - a.version : a.version - b.version));
        }
        const offset = skip ?? 0;
        const paged = results.slice(offset);
        return take ? paged.slice(0, take) : paged;
      },
    ),
    count: jest.fn(async ({ where }: { where?: Record<string, unknown> }) => {
      if (!where) return drafts.size;
      return Array.from(drafts.values()).filter((d) =>
        Object.entries(where).every(([k, v]) => {
          if (k === 'OR') return true;
          return (d as unknown as Record<string, unknown>)[k] === v;
        }),
      ).length;
    }),
    findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      // Supports an optional `OR` clause: any branch can match. Each branch
      // is treated as a separate set of equality constraints against the row.
      const orClauses = Array.isArray(where.OR) ? (where.OR as Array<Record<string, unknown>>) : null;
      const baseEntries = Object.entries(where).filter(([k]) => k !== 'OR');
      return (
        Array.from(drafts.values()).find((d) => {
          const baseMatch = baseEntries.every(([k, v]) => (d as unknown as Record<string, unknown>)[k] === v);
          if (!baseMatch) return false;
          if (orClauses) {
            return orClauses.some((branch) =>
              Object.entries(branch).every(([k, v]) => (d as unknown as Record<string, unknown>)[k] === v),
            );
          }
          return true;
        }) ?? null
      );
    }),
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => drafts.get(where.id) ?? null),
    update: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string; userId?: string; version?: number };
        data: Partial<DraftRecord>;
      }) => {
        const existing = drafts.get(where.id);
        if (
          !existing ||
          (where.userId && existing.userId !== where.userId) ||
          (where.version && existing.version !== where.version)
        ) {
          throw Object.assign(new Error(`Draft ${where.id} not found`), { code: 'P2025' });
        }
        Object.assign(existing, data);
        return existing;
      },
    ),
    delete: jest.fn(async ({ where }: { where: { id: string } }) => {
      const existing = drafts.get(where.id);
      if (!existing) throw new Error(`Draft ${where.id} not found`);
      drafts.delete(where.id);
      return existing;
    }),
    deleteMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const before = drafts.size;
      for (const [id, d] of drafts) {
        if (Object.entries(where).every(([k, v]) => (d as unknown as Record<string, unknown>)[k] === v)) {
          drafts.delete(id);
        }
      }
      return { count: before - drafts.size };
    }),
  };

  const complianceReport = { deleteMany: jest.fn(async () => ({ count: 0 })) };
  const exportHistoryModel = {
    create: jest.fn(async ({ data }: { data: { draftId: string; exportType: string; exportedBy: string } }) => {
      exportHistory.push(data);
      return data;
    }),
    deleteMany: jest.fn(async () => ({ count: 0 })),
  };
  const auditLog = {
    create: jest.fn(
      async ({ data }: { data: { action: string; entityType: string; entityId: string; userId: string } }) => {
        auditLogs.push(data);
        return data;
      },
    ),
  };

  const workflowTransitionModel = {
    create: jest.fn(
      async ({
        data,
      }: {
        data: { draftId: string; fromStatus: string; toStatus: string; actorId: string; remarks?: string };
      }) => {
        workflowTransitions.push(data);
        return data;
      },
    ),
  };

  const member = {
    findUnique: jest.fn(
      async ({ where }: { where: { organizationId_userId: { organizationId: string; userId: string } } }) => ({
        ...where.organizationId_userId,
        role: 'legislative_staff',
      }),
    ),
  };
  const user = {
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => ({ id: where.id, role: 'user' })),
  };

  const tx = {
    draft,
    member,
    user,
    complianceReport,
    exportHistory: exportHistoryModel,
    auditLog,
    workflowTransition: workflowTransitionModel,
  };

  return {
    ...tx,
    $transaction: jest.fn(async <T>(callback: (transaction: typeof tx) => Promise<T>) => callback(tx)),
    _state: { drafts, auditLogs, exportHistory, workflowTransitions },
  };
}

const userId = 'user_1';

const baseCreateInput: CreateDraftDto = {
  title: 'Barangay Curfew Ordinance',
  documentType: 'ORDINANCE',
  jurisdiction: 'barangay',
  jurisdictionName: 'Barangay San Roque',
};

function buildService() {
  const prisma = buildPrismaDouble();
  const artifactStorage = new InMemoryArtifactStorage();
  const officialExportService = new OfficialDocumentExportService();
  const service = new DraftsService(
    prisma as unknown as ConstructorParameters<typeof DraftsService>[0],
    artifactStorage,
    officialExportService,
  );
  return { service, prisma, artifactStorage, officialExportService };
}

function expectDefined<T>(value: T | undefined, message = 'Expected value to be defined'): T {
  expect(value).toBeDefined();
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

describe('DraftsService.create', () => {
  it('persists a new draft at version 1 and logs a CREATE audit entry', async () => {
    const { service, prisma } = buildService();

    const draft = await service.create(baseCreateInput, userId);

    expect(draft).toMatchObject({
      title: 'Barangay Curfew Ordinance',
      documentType: 'ORDINANCE',
      jurisdiction: 'barangay',
      jurisdictionName: 'Barangay San Roque',
      status: 'DRAFT',
      aiGenerated: false,
      userId,
      version: 1,
    });
    expect(prisma._state.auditLogs).toEqual([
      expect.objectContaining({ action: 'CREATE', entityType: 'drafts', userId }),
    ]);
  });
});

describe('DraftsService.findAll', () => {
  it("returns only the caller's root drafts (parentDraftId is null) ordered by updatedAt desc", async () => {
    const { service, prisma } = buildService();
    const a = await service.create({ ...baseCreateInput, title: 'A' }, userId);
    const b = await service.create({ ...baseCreateInput, title: 'B' }, userId);
    // Make A newer so the order is deterministic
    expectDefined(prisma._state.drafts.get(a.id)).updatedAt = new Date(Date.now() + 1000);
    // Plant a revision row that should NOT appear (parentDraftId set)
    prisma._state.drafts.set('rev_only', {
      ...expectDefined(prisma._state.drafts.get(b.id)),
      id: 'rev_only',
      parentDraftId: b.id,
    });

    const results = await service.findAll(userId);

    expect(results.data.map((d) => d.id)).toEqual([a.id, b.id]);
    expect(results.data.find((d) => d.id === 'rev_only')).toBeUndefined();
    expect(results.total).toBe(2);
  });

  it('filters by status when provided', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);
    expectDefined(prisma._state.drafts.get(draft.id)).status = 'REVIEW';

    const results = await service.findAll(userId, 'REVIEW');
    expect(results.data.map((d) => d.id)).toEqual([draft.id]);

    const empty = await service.findAll(userId, 'FINAL');
    expect(empty.data).toEqual([]);
  });

  it("does not return another user's drafts", async () => {
    const { service } = buildService();
    await service.create(baseCreateInput, 'user_A');
    const mine = await service.create({ ...baseCreateInput, title: 'mine' }, 'user_1');

    const results = await service.findAll('user_1');
    expect(results.data).toHaveLength(1);
    expect(results.data[0]?.id).toBe(mine.id);
  });

  it('builds paginated document type and search filters', async () => {
    const { service, prisma } = buildService();

    await service.findAll('user_1', {
      page: 2,
      limit: 10,
      documentType: 'RESOLUTION',
      search: 'curfew',
    });

    expect(prisma.draft.findMany).toHaveBeenLastCalledWith({
      where: {
        userId: 'user_1',
        parentDraftId: null,
        organizationId: null,
        deletedAt: null,
        documentType: 'RESOLUTION',
        OR: [
          { title: { contains: 'curfew', mode: 'insensitive' } },
          { jurisdictionName: { contains: 'curfew', mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      skip: 10,
      take: 10,
    });
  });
});

describe('DraftsService.update', () => {
  it('snapshots the prior draft as a revision and bumps the version when content changes', async () => {
    const { service, prisma } = buildService();
    const original = await service.create(baseCreateInput, userId);
    const originalVersion = original.version; // capture before mutation

    const update: UpdateDraftDto = {
      title: 'Barangay Curfew Ordinance (Revised)',
      commitMessage: 'tweaks',
      expectedVersion: 1,
    };
    const updated = await service.update(original.id, update, userId);

    expect(updated.version).toBe(originalVersion + 1);
    expect(updated.commitMessage).toBe('tweaks');

    // A snapshot row should have been created with the prior state and parentDraftId pointing to root
    const snapshotCalls = prisma.draft.create.mock.calls.filter(
      (call) => (call[0] as { data: { parentDraftId?: string | null } }).data.parentDraftId === original.id,
    );
    expect(snapshotCalls).toHaveLength(1);
    expect(snapshotCalls[0]?.[0]).toMatchObject({
      data: expect.objectContaining({
        version: originalVersion,
        parentDraftId: original.id,
      }),
    });
    expect(prisma._state.auditLogs.find((l) => l.action === 'UPDATE')).toBeDefined();
  });

  it('returns the existing version unchanged when nothing actually changed', async () => {
    const { service, prisma } = buildService();
    const original = await service.create(baseCreateInput, userId);
    prisma.draft.create.mockClear();

    // No-op update: same title, no content change
    const result = await service.update(original.id, { title: original.title, expectedVersion: 1 }, userId);

    expect(result.version).toBe(original.version);
    expect(prisma.draft.create).not.toHaveBeenCalled();
  });

  it('refuses to update a saved revision (only root drafts are mutable)', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(baseCreateInput, userId);
    // Create a "revision" row manually
    const revisionId = 'draft_revision_1';
    prisma._state.drafts.set(revisionId, {
      ...root,
      id: revisionId,
      parentDraftId: root.id,
      version: 1,
    });

    await expect(service.update(revisionId, { title: 'changed', expectedVersion: 1 }, userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('derives the indicative LCE deadline on the server from complete vote and transmittal evidence', async () => {
    const { service, prisma } = buildService();
    const root = await service.create({ ...baseCreateInput, jurisdiction: 'city' }, userId);
    expectDefined(prisma._state.drafts.get(root.id)).content = {
      body: 'Working draft',
      milestones: {
        currentStage: 'THIRD_READING',
        firstReadingDate: '2026-08-01',
        secondReadingDate: '2026-08-02',
        thirdReadingDate: '2026-08-03',
        votingRecord: { ayes: 0, nays: 0, abstentions: 0 },
        lceAction: 'PENDING',
      },
    };
    prisma.user.findUnique.mockResolvedValue({ id: userId, role: 'PRESIDING_OFFICER' });

    const updated = await service.update(
      root.id,
      {
        expectedVersion: 1,
        content: {
          body: 'Working draft',
          milestones: {
            currentStage: 'TRANSMITTED_TO_LCE',
            firstReadingDate: '2026-08-01',
            secondReadingDate: '2026-08-02',
            thirdReadingDate: '2026-08-03',
            transmittedDate: '2026-08-04',
            transmittalDeadline: '2099-01-01',
            votingRecord: {
              totalMembership: 12,
              membersPresent: 10,
              ayes: 6,
              nays: 3,
              abstentions: 1,
              rollCallRecorded: true,
            },
            lceAction: 'PENDING',
          },
        },
      },
      userId,
    );

    expect(updated.content).toMatchObject({
      milestones: { transmittalDeadline: '2026-08-14' },
    });
  });

  it('rejects impossible dates and same-stage executive-action entries', async () => {
    const { service, prisma } = buildService();
    const root = await service.create({ ...baseCreateInput, jurisdiction: 'city' }, userId);

    await expect(
      service.update(
        root.id,
        {
          expectedVersion: 1,
          content: {
            body: 'Working draft',
            milestones: {
              currentStage: 'DRAFTING',
              votingRecord: { ayes: 0, nays: 0, abstentions: 0 },
              lceAction: 'PENDING',
              firstReadingDate: '2026-02-31',
            },
          },
        },
        userId,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expectDefined(prisma._state.drafts.get(root.id)).content = {
      body: 'Working draft',
      milestones: {
        currentStage: 'TRANSMITTED_TO_LCE',
        thirdReadingDate: '2026-08-03',
        transmittedDate: '2026-08-04',
        transmittalDeadline: '2026-08-14',
        votingRecord: {
          totalMembership: 12,
          membersPresent: 10,
          ayes: 6,
          nays: 3,
          abstentions: 1,
          rollCallRecorded: true,
        },
        lceAction: 'PENDING',
      },
    };
    prisma.user.findUnique.mockResolvedValue({ id: userId, role: 'LCE_OFFICE' });

    await expect(
      service.update(
        root.id,
        {
          expectedVersion: 1,
          content: {
            body: 'Working draft',
            milestones: {
              ...(expectDefined(prisma._state.drafts.get(root.id)).content as { milestones: Record<string, unknown> })
                .milestones,
              currentStage: 'TRANSMITTED_TO_LCE',
              lceAction: 'APPROVED',
              lceActionDate: '2026-08-05',
              enactmentBasis: 'LCE_APPROVAL',
            },
          },
        },
        userId,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe('DraftsService.remove', () => {
  it('hard-deletes the root draft, its revisions, related reports, and export history', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);
    // Plant a revision
    prisma._state.drafts.set('draft_revision_1', {
      ...draft,
      id: 'draft_revision_1',
      parentDraftId: draft.id,
    });

    const result = await service.remove(draft.id, userId, draft.version);

    expect(result).toEqual({ success: true });
    expect(prisma._state.drafts.has(draft.id)).toBe(false);
    expect(prisma._state.drafts.has('draft_revision_1')).toBe(false);
    expect(prisma.complianceReport.deleteMany).toHaveBeenCalledWith({
      where: { draftId: { in: [draft.id, 'draft_revision_1'] } },
    });
    expect(prisma.exportHistory.deleteMany).toHaveBeenCalledWith({
      where: { draftId: { in: [draft.id, 'draft_revision_1'] } },
    });
    expect(prisma._state.auditLogs.find((l) => l.action === 'DELETE')).toBeDefined();
  });

  it('refuses to delete a saved revision', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(baseCreateInput, userId);
    const revisionId = 'draft_revision_1';
    prisma._state.drafts.set(revisionId, { ...root, id: revisionId, parentDraftId: root.id });

    await expect(service.remove(revisionId, userId, root.version)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DraftsService.listVersions', () => {
  it('returns the root draft plus its revisions, sorted by version desc', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(baseCreateInput, userId);
    prisma._state.drafts.set('rev_1', {
      ...root,
      id: 'rev_1',
      parentDraftId: root.id,
      version: 1,
    });
    prisma._state.drafts.set('rev_2', {
      ...root,
      id: 'rev_2',
      parentDraftId: root.id,
      version: 2,
    });

    const versions = await service.listVersions(root.id, userId);

    expect(versions.map((v) => v.version)).toEqual([2, 1, 1]); // rev_2 (v2), rev_1 (v1), root (v1)
    expect(versions.find((v) => v.id === root.id)?.isCurrent).toBe(true);
  });
});

describe('DraftsService.exportDraft', () => {
  it('records the export and returns markdown-formatted content for md', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(
      { ...baseCreateInput, content: { body: 'SECTION 1. Curfew hours are 10pm to 4am.' } },
      userId,
    );

    const result = await service.exportDraft(draft.id, userId, 'md', draft.version);

    expect(result.mimeType).toBe('text/markdown');
    expect(result.content).toContain('WORKING DRAFT — NOT AN OFFICIAL RECORD');
    expect(result.content).toContain('# Barangay Curfew Ordinance');
    expect(result.content).toContain('SECTION 1. Curfew hours are 10pm to 4am.');
    expect(result.filename).toMatch(/^Barangay_Curfew_Ordinance_v1\.md$/);
    expect(result.artifactKey).toContain(`exports/${draft.id}/v1.md`);
    expect(result.artifactUrl).toContain(`exports/${draft.id}/v1.md`);
    expect(prisma._state.exportHistory).toEqual([expect.objectContaining({ draftId: draft.id, exportType: 'MD' })]);
  });

  it('renders DOCX server-side and persists it to artifact storage', async () => {
    const { service, prisma, officialExportService } = buildService();
    const draft = await service.create(
      { ...baseCreateInput, content: { body: 'SECTION 1. Curfew hours are 10pm to 4am.' } },
      userId,
    );
    const generateOfficialDocx = jest
      .spyOn(officialExportService, 'generateOfficialDocx')
      .mockResolvedValue(Buffer.from('docx-bytes'));

    const result = await service.exportDraft(draft.id, userId, 'docx', draft.version);

    expect(generateOfficialDocx).toHaveBeenCalledTimes(1);
    expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(result.filename).toMatch(/\.docx$/);
    expect(result.artifactKey).toContain(`exports/${draft.id}/v1.docx`);
    expect(prisma._state.exportHistory).toEqual([expect.objectContaining({ draftId: draft.id, exportType: 'DOCX' })]);
  });

  it('rejects an export when the draft moved past the expected version', async () => {
    const { service } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    await expect(service.exportDraft(draft.id, userId, 'txt', draft.version + 1)).rejects.toThrow(ConflictException);
  });

  it('returns plain-text content with a structured header for txt', async () => {
    const { service } = buildService();
    const draft = await service.create({ ...baseCreateInput, content: { body: 'SECTION 1. Body text.' } }, userId);

    const result = await service.exportDraft(draft.id, userId, 'txt', draft.version);

    expect(result.mimeType).toBe('text/plain');
    expect(result.content).toContain('WORKING DRAFT — NOT AN OFFICIAL RECORD');
    expect(result.content).toContain('ORDINANCE');
    expect(result.content).toContain('SECTION 1. Body text.');
    expect(result.artifactKey).toContain(`exports/${draft.id}/v1.txt`);
  });
});

describe('DraftsService.logExport', () => {
  it('persists file size and page count when provided', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    const dto: LogExportDto = { format: 'pdf', expectedVersion: draft.version, fileSize: 12_345, pageCount: 4 };
    const result = await service.logExport(draft.id, userId, dto);

    expect(result).toEqual({
      success: true,
      draftId: draft.id,
      draftVersion: draft.version,
      titleSnapshot: draft.title,
    });
    expect(prisma._state.exportHistory).toEqual([
      expect.objectContaining({
        draftId: draft.id,
        draftVersion: draft.version,
        titleSnapshot: draft.title,
        exportType: 'PDF',
      }),
    ]);
  });

  it('rejects telemetry for a stale draft version', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    await expect(
      service.logExport(draft.id, userId, { format: 'pdf', expectedVersion: draft.version + 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma._state.exportHistory).toEqual([]);
  });
});

describe('DraftsService.restoreVersion', () => {
  it('snapshots the current draft and rolls back to the requested revision', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(
      { ...baseCreateInput, content: { body: 'SECTION 1. Original content.' } },
      userId,
    );

    // Apply an update so a revision row exists
    const updated = await service.update(root.id, { title: 'Title 2', expectedVersion: 1 }, userId);
    // Capture the version as a primitive so the later restore (which mutates
    // the same draft object via Object.assign) can't shift the comparison.
    const versionAfterUpdate = updated.version;

    // Find the snapshot row (the prior state)
    const snapshot = Array.from(prisma._state.drafts.values()).find((d) => d.parentDraftId === root.id);
    expect(snapshot).toBeDefined();

    // Restore from the snapshot
    const snapshotRecord = expectDefined(snapshot);
    const result = await service.restoreVersion(root.id, snapshotRecord.id, userId, versionAfterUpdate);

    expect(result.success).toBe(true);
    expect(result.restoredFromVersion).toBe(snapshotRecord.version);

    // The current draft should now have the snapshot's title (the original)
    const afterRestore = await service.findOne(root.id, userId);
    expect(afterRestore.title).toBe('Barangay Curfew Ordinance');
    // The restore creates a new version: original (v1) -> update (v2) -> restore (v3)
    expect(afterRestore.version).toBe(versionAfterUpdate + 1);

    // A new snapshot of the pre-restore state should have been created
    const newSnapshots = Array.from(prisma._state.drafts.values()).filter((d) => d.parentDraftId === root.id);
    expect(newSnapshots.length).toBeGreaterThanOrEqual(2);

    // Audit log should record the restore action
    expect(prisma._state.auditLogs.find((l) => l.action === 'RESTORE_VERSION')).toBeDefined();
  });

  it('returns the current version when restoring from the root draft itself (no-op)', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(baseCreateInput, userId);

    const result = await service.restoreVersion(root.id, root.id, userId, root.version);

    expect(result).toEqual({ success: true, version: root.version });
    // No new snapshot row should be created in the no-op path
    const snapshotCount = Array.from(prisma._state.drafts.values()).filter((d) => d.parentDraftId === root.id).length;
    expect(snapshotCount).toBe(0);
  });

  it('throws NotFoundException when the version id does not belong to the draft', async () => {
    const { service } = buildService();
    const root = await service.create(baseCreateInput, userId);
    // Some other draft, unrelated
    const other = await service.create({ ...baseCreateInput, title: 'Other' }, 'user_other');

    await expect(service.restoreVersion(root.id, other.id, userId, root.version)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses to restore on a saved revision (only root drafts can be restored)', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(baseCreateInput, userId);
    await service.update(root.id, { title: 'Title 2', expectedVersion: 1 }, userId);
    const snapshot = Array.from(prisma._state.drafts.values()).find((d) => d.parentDraftId === root.id);

    // Try to restore on the snapshot (which is itself a revision)
    const snapshotRecord = expectDefined(snapshot);
    await expect(
      service.restoreVersion(snapshotRecord.id, snapshotRecord.id, userId, snapshotRecord.version),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DraftsService Multi-Tenancy & OCC', () => {
  it('creates an organization draft for a persisted member', async () => {
    const { service } = buildService();
    const draft = await service.create(
      {
        ...baseCreateInput,
        organizationId: 'lgu_org_1',
      },
      userId,
    );

    expect(draft.organizationId).toBe('lgu_org_1');
  });

  it('rejects an organization identifier when the caller is not a member', async () => {
    const { service, prisma } = buildService();
    prisma.member.findUnique.mockResolvedValueOnce(null as never);

    await expect(service.create({ ...baseCreateInput, organizationId: 'other_tenant' }, userId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma._state.drafts.size).toBe(0);
  });

  it('lists every organization draft for a persisted member', async () => {
    const { service, prisma } = buildService();
    const sharedDraft = await service.create(
      { ...baseCreateInput, title: 'Shared LGU Draft', organizationId: 'org_1' },
      'author_user',
    );
    await service.create({ ...baseCreateInput, title: 'Other LGU Draft', organizationId: 'org_2' }, 'user_2');

    const result = await service.findAll('member_user', { organizationId: 'org_1' });

    expect(result.data).toEqual([
      expect.objectContaining({
        id: sharedDraft.id,
        effectiveRole: 'LEGISLATIVE_STAFF',
        canEdit: true,
        canDelete: false,
      }),
    ]);
    expect(prisma.draft.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org_1',
          parentDraftId: null,
          deletedAt: null,
        },
      }),
    );
  });

  it('keeps a generic organization member read-only', async () => {
    const { service, prisma } = buildService();
    const sharedDraft = await service.create(
      { ...baseCreateInput, title: 'Shared Draft', organizationId: 'org_1' },
      'author_user',
    );
    prisma.member.findUnique.mockResolvedValue({ organizationId: 'org_1', userId: 'viewer', role: 'member' } as never);

    await expect(service.findOne(sharedDraft.id, 'viewer')).resolves.toMatchObject({
      id: sharedDraft.id,
      effectiveRole: null,
      canEdit: false,
      canDelete: false,
    });
    await expect(
      service.update(sharedDraft.id, { title: 'Viewer Edit Blocked', expectedVersion: 1 }, 'viewer'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows a persisted organization drafting member to read and update another member's draft", async () => {
    const { service } = buildService();
    const sharedDraft = await service.create(
      { ...baseCreateInput, title: 'Shared Draft', organizationId: 'org_1' },
      'author_user',
    );

    await expect(service.findOne(sharedDraft.id, 'member_user')).resolves.toMatchObject({ id: sharedDraft.id });
    const updated = await service.update(
      sharedDraft.id,
      { title: 'Collaboratively Updated', expectedVersion: 1 },
      'member_user',
    );
    expect(updated).toMatchObject({ title: 'Collaboratively Updated', version: 2 });
  });

  it("prevents a non-admin collaborator from deleting another member's organization draft", async () => {
    const { service, prisma } = buildService();
    const sharedDraft = await service.create(
      { ...baseCreateInput, title: 'Shared Draft', organizationId: 'org_1' },
      'author_user',
    );

    await expect(service.remove(sharedDraft.id, 'member_user', sharedDraft.version)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma._state.drafts.has(sharedDraft.id)).toBe(true);
  });

  it("allows an organization administrator to delete another member's draft", async () => {
    const { service, prisma } = buildService();
    const sharedDraft = await service.create(
      { ...baseCreateInput, title: 'Shared Draft', organizationId: 'org_1' },
      'author_user',
    );
    prisma.member.findUnique
      .mockResolvedValueOnce({ organizationId: 'org_1', userId: 'admin_user', role: 'owner' } as never)
      .mockResolvedValueOnce({ organizationId: 'org_1', userId: 'admin_user', role: 'owner' } as never);

    await expect(service.remove(sharedDraft.id, 'admin_user', sharedDraft.version)).resolves.toEqual({ success: true });
    expect(prisma._state.drafts.get(sharedDraft.id)).toMatchObject({
      deletedBy: 'admin_user',
      version: 2,
    });
    expect(prisma._state.drafts.get(sharedDraft.id)?.deletedAt).toBeInstanceOf(Date);
    await expect(service.findOne(sharedDraft.id, 'admin_user')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findAll('admin_user', { organizationId: 'org_1' })).resolves.toMatchObject({ data: [] });
  });

  it('returns not found for a non-member without exposing an organization draft', async () => {
    const { service, prisma } = buildService();
    const sharedDraft = await service.create(
      { ...baseCreateInput, title: 'Private LGU Draft', organizationId: 'org_1' },
      'author_user',
    );
    prisma.member.findUnique.mockResolvedValueOnce(null as never);

    await expect(service.findOne(sharedDraft.id, 'outsider_user')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports read-only capabilities for a researcher-owned personal draft', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);
    prisma.user.findUnique.mockResolvedValueOnce({ id: userId, role: 'researcher' });

    await expect(service.findOne(draft.id, userId)).resolves.toMatchObject({
      effectiveRole: null,
      canEdit: false,
      canDelete: false,
    });
  });

  it('throws ConflictException on update when expectedVersion does not match current version (OCC)', async () => {
    const { service } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    await expect(
      service.update(draft.id, { title: 'Conflicting Edit', expectedVersion: 99 }, userId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects deletion when the expected version is stale', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    await expect(service.remove(draft.id, userId, 99)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma._state.drafts.has(draft.id)).toBe(true);
  });

  it('succeeds update when expectedVersion matches current draft version', async () => {
    const { service } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    const updated = await service.update(draft.id, { title: 'Safe Edit', expectedVersion: 1 }, userId);
    expect(updated.version).toBe(2);
    expect(updated.title).toBe('Safe Edit');
  });

  it('records WorkflowTransition when status changes during update', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    await service.update(
      draft.id,
      { status: 'REVIEW', commitMessage: 'Submitted for draft review', expectedVersion: 1 },
      userId,
    );

    expect(prisma._state.workflowTransitions).toEqual([
      expect.objectContaining({
        draftId: draft.id,
        fromStatus: 'DRAFT',
        toStatus: 'REVIEW',
        actorId: userId,
        remarks: 'Submitted for draft review',
      }),
    ]);
  });
});
