import { NotFoundException } from '@nestjs/common';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

interface TemplateRecord {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  jurisdiction: string[];
  structure: unknown;
  exampleContent?: unknown;
  isPublic: boolean;
  usageCount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaDouble {
  template: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  auditLog: { create: jest.Mock };
  $transaction: jest.Mock;
  state: {
    templates: Map<string, TemplateRecord>;
    auditLogs: Array<{ action: string; entityType: string; entityId: string; userId: string; changes?: unknown }>;
  };
}

function buildPrismaDouble(): PrismaDouble {
  const templates = new Map<string, TemplateRecord>();
  const auditLogs: Array<{ action: string; entityType: string; entityId: string; userId: string; changes?: unknown }> =
    [];

  const template = {
    create: jest.fn(async ({ data }: { data: Partial<TemplateRecord> }) => {
      const id = data.id ?? `tmpl_${templates.size + 1}`;
      const record: TemplateRecord = {
        id,
        name: data.name ?? 'Untitled',
        category: data.category ?? 'Other',
        subcategory: data.subcategory,
        jurisdiction: data.jurisdiction ?? ['barangay'],
        structure: data.structure ?? {},
        exampleContent: data.exampleContent,
        isPublic: data.isPublic ?? true,
        usageCount: data.usageCount ?? 0,
        userId: data.userId ?? 'user_1',
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      };
      templates.set(id, record);
      return record;
    }),
    findMany: jest.fn(
      async ({ where, orderBy }: { where?: Record<string, unknown>; orderBy?: { usageCount?: 'asc' | 'desc' } }) => {
        let results = Array.from(templates.values());
        if (where) {
          if ('isPublic' in where) {
            results = results.filter((t) => t.isPublic === where.isPublic);
          }
          if ('category' in where) {
            results = results.filter((t) => t.category === where.category);
          }
          if ('OR' in where) {
            const ors = where.OR as Array<Record<string, unknown>>;
            results = results.filter((t) =>
              ors.some((cond) =>
                Object.entries(cond).every(([k, v]) => (t as unknown as Record<string, unknown>)[k] === v),
              ),
            );
          }
        }
        if (orderBy?.usageCount) {
          results.sort((a, b) =>
            orderBy.usageCount === 'desc' ? b.usageCount - a.usageCount : a.usageCount - b.usageCount,
          );
        }
        return results;
      },
    ),
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => templates.get(where.id) ?? null),
    update: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<TemplateRecord> & { usageCount?: { increment?: number } | number };
      }) => {
        const existing = templates.get(where.id);
        if (!existing) throw new Error(`Template ${where.id} not found`);
        if (data.usageCount && typeof data.usageCount === 'object' && 'increment' in data.usageCount) {
          const inc = (data.usageCount as { increment?: number }).increment ?? 0;
          existing.usageCount += inc;
          delete (data as { usageCount?: unknown }).usageCount;
        }
        Object.assign(existing, data);
        return existing;
      },
    ),
    delete: jest.fn(async ({ where }: { where: { id: string } }) => {
      const existing = templates.get(where.id);
      if (!existing) throw new Error(`Template ${where.id} not found`);
      templates.delete(where.id);
      return existing;
    }),
  };

  const auditLog = {
    create: jest.fn(
      async ({
        data,
      }: {
        data: { action: string; entityType: string; entityId: string; userId: string; changes?: unknown };
      }) => {
        auditLogs.push(data);
        return data;
      },
    ),
  };

  const tx = { template, auditLog };

  return {
    ...tx,
    $transaction: jest.fn(async <T>(callback: (transaction: typeof tx) => Promise<T>) => callback(tx)),
    state: { templates, auditLogs },
  };
}

function buildService() {
  const prisma = buildPrismaDouble();
  const service = new TemplatesService(prisma as unknown as ConstructorParameters<typeof TemplatesService>[0]);
  return { service, prisma };
}

describe('TemplatesService.create', () => {
  it('persists a new template and logs a CREATE audit entry', async () => {
    const { service, prisma } = buildService();

    const dto: CreateTemplateDto = {
      name: 'Curfew Ordinance',
      category: 'Public Safety',
      subcategory: 'Curfew',
      jurisdiction: ['barangay', 'city'],
      structure: { documentType: 'ORDINANCE', sections: [] },
      isPublic: true,
    };

    const template = await service.create(dto, 'user_1');

    expect(template).toMatchObject({
      name: 'Curfew Ordinance',
      category: 'Public Safety',
      isPublic: true,
      usageCount: 0,
      userId: 'user_1',
    });
    expect(prisma.state.auditLogs).toEqual([
      expect.objectContaining({ action: 'CREATE', entityType: 'templates', userId: 'user_1' }),
    ]);
  });

  it('defaults isPublic to true when not provided', async () => {
    const { service } = buildService();

    const dto: CreateTemplateDto = {
      name: 'Private Template',
      category: 'Other',
      jurisdiction: ['barangay'],
      structure: {},
    };

    const template = await service.create(dto, 'user_1');

    expect(template.isPublic).toBe(true);
  });
});

describe('TemplatesService.findAll', () => {
  it('returns only public templates when publicOnly=true', async () => {
    const { service } = buildService();
    await service.create(
      { name: 'Public A', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: true },
      'user_A',
    );
    await service.create(
      { name: 'Private B', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: false },
      'user_B',
    );
    await service.create(
      { name: 'Private C (caller)', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: false },
      'user_A',
    );

    const results = await service.findAll('user_A', undefined, true);

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Public A');
  });

  it("returns public templates plus the caller's private templates when publicOnly=false", async () => {
    const { service } = buildService();
    await service.create(
      { name: 'Public A', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: true },
      'user_A',
    );
    await service.create(
      {
        name: 'Private B (other user)',
        category: 'Health',
        jurisdiction: ['barangay'],
        structure: {},
        isPublic: false,
      },
      'user_B',
    );
    await service.create(
      { name: 'Private C (caller)', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: false },
      'user_A',
    );

    const results = await service.findAll('user_A', undefined, false);

    const names = results.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(['Public A', 'Private C (caller)']));
    expect(names).not.toContain('Private B (other user)');
  });

  it('filters by category when provided', async () => {
    const { service } = buildService();
    await service.create(
      { name: 'Health Template', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_1',
    );
    await service.create(
      { name: 'Revenue Template', category: 'Revenue', jurisdiction: ['barangay'], structure: {} },
      'user_1',
    );

    const results = await service.findAll('user_1', 'Health', true);

    expect(results.map((t) => t.name)).toEqual(['Health Template']);
  });

  it('returns an empty array when no templates match', async () => {
    const { service } = buildService();
    const results = await service.findAll('user_1', undefined, true);
    expect(results).toEqual([]);
  });

  it('orders results by usageCount descending', async () => {
    const { service, prisma } = buildService();
    const t1 = await service.create(
      { name: 'Low', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_1',
    );
    const t2 = await service.create(
      { name: 'High', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_1',
    );
    const t2Record = prisma.state.templates.get(t2.id);
    const t1Record = prisma.state.templates.get(t1.id);
    if (t2Record) t2Record.usageCount = 10;
    if (t1Record) t1Record.usageCount = 1;

    const results = await service.findAll('user_1', undefined, true);

    expect(results.map((t) => t.name)).toEqual(['High', 'Low']);
  });

  it('builds paginated jurisdiction and search filters', async () => {
    const { service, prisma } = buildService();

    await service.findAll('user_1', {
      page: 3,
      limit: 5,
      category: 'Health',
      jurisdiction: 'city',
      publicOnly: true,
      search: 'waste',
    });

    expect(prisma.template.findMany).toHaveBeenLastCalledWith({
      where: {
        isPublic: true,
        category: 'Health',
        jurisdiction: { has: 'city' },
        AND: [
          {
            OR: [
              { name: { contains: 'waste', mode: 'insensitive' } },
              { subcategory: { contains: 'waste', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { usageCount: 'desc' },
      skip: 10,
      take: 5,
    });
  });
});

describe('TemplatesService.findOne', () => {
  it('returns a public template regardless of caller', async () => {
    const { service } = buildService();
    const created = await service.create(
      { name: 'Public', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: true },
      'user_A',
    );

    const result = await service.findOne(created.id, 'user_B');

    expect(result.id).toBe(created.id);
  });

  it("returns the owner's private template", async () => {
    const { service } = buildService();
    const created = await service.create(
      { name: 'Private', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: false },
      'user_A',
    );

    const result = await service.findOne(created.id, 'user_A');

    expect(result.id).toBe(created.id);
  });

  it('throws NotFoundException when a non-owner tries to read a private template', async () => {
    const { service } = buildService();
    const created = await service.create(
      { name: 'Private', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: false },
      'user_A',
    );

    await expect(service.findOne(created.id, 'user_B')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException for a missing template id', async () => {
    const { service } = buildService();

    await expect(service.findOne('does-not-exist', 'user_1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TemplatesService.update', () => {
  it('updates an owned template', async () => {
    const { service, prisma } = buildService();
    const created = await service.create(
      { name: 'Original', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_1',
    );

    const dto: UpdateTemplateDto = { name: 'Renamed' };
    const updated = await service.update(created.id, dto, 'user_1');

    expect(updated.name).toBe('Renamed');
    expect(prisma.state.auditLogs.find((log) => log.action === 'UPDATE')).toEqual(
      expect.objectContaining({ entityType: 'templates', entityId: created.id, userId: 'user_1' }),
    );
  });

  it('refuses to update a template owned by another user', async () => {
    const { service } = buildService();
    const created = await service.create(
      { name: 'Original', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_A',
    );

    await expect(service.update(created.id, { name: 'Hacked' }, 'user_B')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TemplatesService.remove', () => {
  it('deletes an owned template and logs DELETE audit', async () => {
    const { service, prisma } = buildService();
    const created = await service.create(
      { name: 'To Delete', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_1',
    );

    const result = await service.remove(created.id, 'user_1');

    expect(result).toEqual({ success: true });
    expect(prisma.state.auditLogs.find((l) => l.action === 'DELETE')).toBeDefined();
  });

  it('refuses to delete a template owned by another user', async () => {
    const { service } = buildService();
    const created = await service.create(
      { name: 'Original', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_A',
    );

    await expect(service.remove(created.id, 'user_B')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TemplatesService.incrementUsage', () => {
  it('increments the usageCount and persists the change', async () => {
    const { service, prisma } = buildService();
    const created = await service.create(
      { name: 'Counted', category: 'Health', jurisdiction: ['barangay'], structure: {} },
      'user_1',
    );
    expect(created.usageCount).toBe(0);

    await service.incrementUsage(created.id, 'user_2');
    await service.incrementUsage(created.id, 'user_3');

    expect(prisma.state.templates.get(created.id)?.usageCount).toBe(2);
  });

  it('allows the owner to increment a private template', async () => {
    const { service, prisma } = buildService();
    const created = await service.create(
      { name: 'Private Counted', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: false },
      'user_1',
    );

    await service.incrementUsage(created.id, 'user_1');

    expect(prisma.state.templates.get(created.id)?.usageCount).toBe(1);
  });

  it('refuses to increment a private template owned by another user', async () => {
    const { service } = buildService();
    const created = await service.create(
      { name: 'Private Counted', category: 'Health', jurisdiction: ['barangay'], structure: {}, isPublic: false },
      'user_1',
    );

    await expect(service.incrementUsage(created.id, 'user_2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
