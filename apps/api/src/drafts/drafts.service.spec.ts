import { NotFoundException } from '@nestjs/common';
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
  templateId?: string | null;
  version: number;
  parentDraftId?: string | null;
  commitMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function buildPrismaDouble() {
  const drafts = new Map<string, DraftRecord>();
  const auditLogs: Array<{ action: string; entityType: string; entityId: string; userId: string }> = [];
  const exportHistory: Array<{ draftId: string; exportType: string; exportedBy: string }> = [];

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
        templateId: data.templateId ?? null,
        version: data.version ?? 1,
        parentDraftId: data.parentDraftId ?? null,
        commitMessage: data.commitMessage ?? null,
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
        take,
      }: {
        where?: Record<string, unknown>;
        orderBy?: { updatedAt?: 'asc' | 'desc'; version?: 'asc' | 'desc' };
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
        return take ? results.slice(0, take) : results;
      },
    ),
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
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<DraftRecord> }) => {
      const existing = drafts.get(where.id);
      if (!existing) throw new Error(`Draft ${where.id} not found`);
      Object.assign(existing, data);
      return existing;
    }),
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

  return {
    draft,
    complianceReport,
    exportHistory: exportHistoryModel,
    auditLog,
    _state: { drafts, auditLogs, exportHistory },
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
  const service = new DraftsService(prisma as unknown as ConstructorParameters<typeof DraftsService>[0]);
  return { service, prisma };
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
    prisma._state.drafts.get(a.id)!.updatedAt = new Date(Date.now() + 1000);
    // Plant a revision row that should NOT appear (parentDraftId set)
    prisma._state.drafts.set('rev_only', {
      ...prisma._state.drafts.get(b.id)!,
      id: 'rev_only',
      parentDraftId: b.id,
    });

    const results = await service.findAll(userId);

    expect(results.map((d) => d.id)).toEqual([a.id, b.id]);
    expect(results.find((d) => d.id === 'rev_only')).toBeUndefined();
  });

  it('filters by status when provided', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);
    prisma._state.drafts.get(draft.id)!.status = 'REVIEW';

    const results = await service.findAll(userId, 'REVIEW');
    expect(results.map((d) => d.id)).toEqual([draft.id]);

    const empty = await service.findAll(userId, 'FINAL');
    expect(empty).toEqual([]);
  });

  it("does not return another user's drafts", async () => {
    const { service } = buildService();
    await service.create(baseCreateInput, 'user_A');
    const mine = await service.create({ ...baseCreateInput, title: 'mine' }, 'user_1');

    const results = await service.findAll('user_1');
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe(mine.id);
  });
});

describe('DraftsService.update', () => {
  it('snapshots the prior draft as a revision and bumps the version when content changes', async () => {
    const { service, prisma } = buildService();
    const original = await service.create(baseCreateInput, userId);
    const originalVersion = original.version; // capture before mutation

    const update: UpdateDraftDto = { title: 'Barangay Curfew Ordinance (Revised)', commitMessage: 'tweaks' };
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
    const result = await service.update(original.id, { title: original.title }, userId);

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

    await expect(service.update(revisionId, { title: 'changed' }, userId)).rejects.toBeInstanceOf(NotFoundException);
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

    const result = await service.remove(draft.id, userId);

    expect(result).toEqual({ success: true });
    expect(prisma._state.drafts.has(draft.id)).toBe(false);
    expect(prisma._state.drafts.has('draft_revision_1')).toBe(false);
    expect(prisma.complianceReport.deleteMany).toHaveBeenCalledWith({ where: { draftId: draft.id } });
    expect(prisma.exportHistory.deleteMany).toHaveBeenCalledWith({ where: { draftId: draft.id } });
    expect(prisma._state.auditLogs.find((l) => l.action === 'DELETE')).toBeDefined();
  });

  it('refuses to delete a saved revision', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(baseCreateInput, userId);
    const revisionId = 'draft_revision_1';
    prisma._state.drafts.set(revisionId, { ...root, id: revisionId, parentDraftId: root.id });

    await expect(service.remove(revisionId, userId)).rejects.toBeInstanceOf(NotFoundException);
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

    const result = await service.exportDraft(draft.id, userId, 'md');

    expect(result.mimeType).toBe('text/markdown');
    expect(result.content).toContain('# Barangay Curfew Ordinance');
    expect(result.content).toContain('SECTION 1. Curfew hours are 10pm to 4am.');
    expect(result.filename).toMatch(/^Barangay_Curfew_Ordinance_v1\.md$/);
    expect(prisma._state.exportHistory).toEqual([expect.objectContaining({ draftId: draft.id, exportType: 'MD' })]);
  });

  it('returns plain-text content with a structured header for txt', async () => {
    const { service } = buildService();
    const draft = await service.create({ ...baseCreateInput, content: { body: 'SECTION 1. Body text.' } }, userId);

    const result = await service.exportDraft(draft.id, userId, 'txt');

    expect(result.mimeType).toBe('text/plain');
    expect(result.content).toContain('ORDINANCE');
    expect(result.content).toContain('SECTION 1. Body text.');
  });
});

describe('DraftsService.logExport', () => {
  it('persists file size and page count when provided', async () => {
    const { service, prisma } = buildService();
    const draft = await service.create(baseCreateInput, userId);

    const dto: LogExportDto = { format: 'pdf', fileSize: 12_345, pageCount: 4 };
    const result = await service.logExport(draft.id, userId, dto);

    expect(result).toEqual({ success: true });
    expect(prisma._state.exportHistory).toEqual([expect.objectContaining({ draftId: draft.id, exportType: 'PDF' })]);
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
    const updated = await service.update(root.id, { title: 'Title 2' }, userId);
    // Capture the version as a primitive so the later restore (which mutates
    // the same draft object via Object.assign) can't shift the comparison.
    const versionAfterUpdate = updated.version;

    // Find the snapshot row (the prior state)
    const snapshot = Array.from(prisma._state.drafts.values()).find((d) => d.parentDraftId === root.id);
    expect(snapshot).toBeDefined();

    // Restore from the snapshot
    const result = await service.restoreVersion(root.id, snapshot!.id, userId);

    expect(result.success).toBe(true);
    expect(result.restoredFromVersion).toBe(snapshot!.version);

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

    const result = await service.restoreVersion(root.id, root.id, userId);

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

    await expect(service.restoreVersion(root.id, other.id, userId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to restore on a saved revision (only root drafts can be restored)', async () => {
    const { service, prisma } = buildService();
    const root = await service.create(baseCreateInput, userId);
    await service.update(root.id, { title: 'Title 2' }, userId);
    const snapshot = Array.from(prisma._state.drafts.values()).find((d) => d.parentDraftId === root.id);

    // Try to restore on the snapshot (which is itself a revision)
    await expect(service.restoreVersion(snapshot!.id, snapshot!.id, userId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
