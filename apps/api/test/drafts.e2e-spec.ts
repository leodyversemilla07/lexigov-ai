import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/auth/auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import type { AuthenticatedUser } from '../src/auth/current-user.decorator';

// ---------------------------------------------------------------------------
// Mock authenticated user injected by the overridden AuthGuard
// ---------------------------------------------------------------------------
const testUser: AuthenticatedUser = {
  id: 'e2e_user_1',
  email: 'test@lexigov.ph',
  role: 'user',
};

/** Always-authenticated guard for e2e tests. */
const mockAuthGuardInstance = {
  canActivate: async (context: any) => {
    context.switchToHttp().getRequest().user = testUser;
    return true;
  },
};

// ---------------------------------------------------------------------------
// Mock PrismaService – returns deterministic data without a real database.
// ---------------------------------------------------------------------------
function mockPrismaService() {
  const drafts: Array<Record<string, unknown>> = [];
  let draftSeq = 0;

  const mocks = {
    $transaction: jest.fn(async (cb: (prisma: any) => any) => {
      return cb(mocks);
    }),
    auditLog: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
    },
    complianceReport: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    exportHistory: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    draft: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: `draft_${++draftSeq}`,
          ...data,
          parentDraftId: (data.parentDraftId as string | null) ?? null,
          userId: data.userId as string,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        drafts.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where, skip, take, orderBy }: any) => {
        let results = drafts.filter((d) => {
          if (!where) return true;
          return Object.entries(where).every(([k, v]) => {
            if (k === 'AND' || k === 'OR') return true;
            return d[k] === v;
          });
        });
        if (orderBy?.updatedAt === 'desc') {
          results = [...results].sort(
            (a, b) => new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime(),
          );
        }
        const offset = skip ?? 0;
        const paged = results.slice(offset);
        return take ? paged.slice(0, take) : paged;
      }),
      findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return drafts.find((d) => Object.entries(where).every(([k, v]) => d[k] === v)) ?? null;
      }),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        return drafts.find((d) => d.id === where.id) ?? null;
      }),
      count: jest.fn(async ({ where }: { where?: Record<string, unknown> }) => {
        if (!where) return drafts.length;
        return drafts.filter((d) => Object.entries(where).every(([k, v]) => d[k] === v)).length;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = drafts.findIndex((d) => d.id === where.id);
        if (idx === -1) return null;
        drafts[idx] = { ...drafts[idx], ...data, updatedAt: new Date() };
        return drafts[idx];
      }),
      delete: jest.fn(async ({ where }: { where: { id: string } }) => {
        const idx = drafts.findIndex((d) => d.id === where.id);
        if (idx === -1) return null;
        const [removed] = drafts.splice(idx, 1);
        return removed;
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
  };

  return mocks;
}

describe('DraftsController (e2e)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeAll(async () => {
    prisma = mockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuardInstance)
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // -----------------------------------------------------------------------
  // POST /api/drafts
  // -----------------------------------------------------------------------
  describe('POST /api/drafts', () => {
    it('creates a draft with valid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: 'E2E Test Ordinance', documentType: 'ORDINANCE', jurisdiction: 'barangay', jurisdictionName: 'Brgy E2E' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'E2E Test Ordinance',
        documentType: 'ORDINANCE',
        jurisdiction: 'barangay',
        status: 'DRAFT',
      });
      expect(res.body.id).toBeDefined();
    });

    it('rejects empty title', async () => {
      await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: '', documentType: 'ORDINANCE', jurisdiction: 'barangay', jurisdictionName: 'Test' })
        .expect(400);
    });

    it('rejects invalid documentType', async () => {
      await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: 'Bad Type', documentType: 'INVALID', jurisdiction: 'barangay', jurisdictionName: 'Test' })
        .expect(400);
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/drafts
  // -----------------------------------------------------------------------
  describe('GET /api/drafts', () => {
    it('returns paginated drafts', async () => {
      await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: 'Draft A', documentType: 'ORDINANCE', jurisdiction: 'barangay', jurisdictionName: 'A' });

      await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: 'Draft B', documentType: 'RESOLUTION', jurisdiction: 'municipal', jurisdictionName: 'B' });

      const res = await request(app.getHttpServer())
        .get('/drafts')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('filters by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/drafts?status=DRAFT')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/drafts/:id
  // -----------------------------------------------------------------------
  describe('GET /api/drafts/:id', () => {
    it('returns a single draft', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: 'Single Draft', documentType: 'ORDINANCE', jurisdiction: 'barangay', jurisdictionName: 'Test' });

      const draftId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .get(`/drafts/${draftId}`)
        .expect(200);

      expect(res.body.id).toBe(draftId);
      expect(res.body.title).toBe('Single Draft');
    });

    it('returns 404 for non-existent draft', async () => {
      await request(app.getHttpServer())
        .get('/drafts/non_existent_id')
        .expect(404);
    });
  });

  // -----------------------------------------------------------------------
  // PATCH /api/drafts/:id (update)
  // -----------------------------------------------------------------------
  describe('PATCH /api/drafts/:id', () => {
    it('updates a draft', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: 'Before Update', documentType: 'ORDINANCE', jurisdiction: 'barangay', jurisdictionName: 'Test' });

      const draftId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .patch(`/drafts/${draftId}`)
        .send({ title: 'After Update' })
        .expect(200);

      expect(res.body.title).toBe('After Update');
    });
  });

  // -----------------------------------------------------------------------
  // DELETE /api/drafts/:id
  // -----------------------------------------------------------------------
  describe('DELETE /api/drafts/:id', () => {
    it('deletes a draft', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/drafts')
        .send({ title: 'To Delete', documentType: 'ORDINANCE', jurisdiction: 'barangay', jurisdictionName: 'Test' });

      const draftId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/drafts/${draftId}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/drafts/${draftId}`)
        .expect(404);
    });
  });
});
