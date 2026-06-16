import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/auth/auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import type { AuthenticatedUser } from '../src/auth/current-user.decorator';

const testUser: AuthenticatedUser = { id: 'e2e_user_1', email: 'test@lexigov.ph', role: 'user' };

const mockAuthGuardInstance = {
  canActivate: async (context: any) => {
    context.switchToHttp().getRequest().user = testUser;
    return true;
  },
};

function mockPrismaService() {
  const drafts: Array<Record<string, unknown>> = [];
  const complianceReports: Array<Record<string, unknown>> = [];
  let draftSeq = 0;

  const mocks = {
    $transaction: jest.fn(async (cb: (prisma: any) => any) => cb(mocks)),
    auditLog: { create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data) },
    complianceReport: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = { id: `cr_${complianceReports.length + 1}`, ...data };
        complianceReports.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where }: { where?: Record<string, unknown> }) => {
        if (!where) return complianceReports;
        return complianceReports.filter((r) =>
          Object.entries(where).every(([k, v]) => r[k] === v),
        );
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
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
        return take ? results.slice(offset, offset + take) : results.slice(offset);
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

describe('ComplianceController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuardInstance)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /compliance/:draftId', () => {
    it('returns empty array when no reports exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/compliance/nonexistent')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('POST /compliance/:draftId/check', () => {
    it('runs compliance check on a draft', async () => {
      // Create a draft first
      const createRes = await request(app.getHttpServer())
        .post('/drafts')
        .send({
          title: 'Compliance Test Draft',
          documentType: 'ORDINANCE',
          jurisdiction: 'barangay',
          jurisdictionName: 'Brgy Test',
        })
        .expect(201);

      const draftId = createRes.body.id;

      // Run compliance check
      const res = await request(app.getHttpServer())
        .post(`/compliance/${draftId}/check`)
        .expect(201);

      expect(res.body).toHaveProperty('overallScore');
      expect(res.body).toHaveProperty('isValid');
      expect(res.body).toHaveProperty('issues');
      expect(Array.isArray(res.body.issues)).toBe(true);
    });

    it('returns 404 for non-existent draft', async () => {
      await request(app.getHttpServer())
        .post('/compliance/nonexistent/check')
        .expect(404);
    });
  });
});
