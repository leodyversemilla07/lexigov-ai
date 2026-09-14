import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '../src/auth/auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import type { AuthenticatedUser } from '../src/auth/auth.service';

const testUser: AuthenticatedUser = { userId: 'e2e_user_1', email: 'test@lexigov.ph', role: 'user' };

const mockAuthGuardInstance = {
  canActivate: async (context: any) => {
    context.switchToHttp().getRequest().user = testUser;
    return true;
  },
};

function mockPrismaService() {
  const templates: Array<Record<string, unknown>> = [];
  let templateSeq = 0;

  const mocks = {
    $transaction: jest.fn(async (cb: (prisma: any) => any) => cb(mocks)),
    auditLog: { create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data) },
    complianceReport: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    exportHistory: { deleteMany: jest.fn(async () => ({ count: 0 })) },
    draft: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: `m_${Date.now()}`, ...data })),
      findMany: jest.fn(async () => []),
      findFirst: jest.fn(async () => null),
      findUnique: jest.fn(async () => null),
      count: jest.fn(async () => 0),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
      delete: jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    template: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = { id: `t_${++templateSeq}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        templates.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where, skip, take }: any) => {
        let results = templates;
        if (where?.isPublic !== undefined) {
          results = results.filter((t) => t.isPublic === where.isPublic);
        }
        if (where?.category) {
          results = results.filter((t) => t.category === where.category);
        }
        const offset = skip ?? 0;
        return take ? results.slice(offset, offset + take) : results.slice(offset);
      }),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        return templates.find((t) => t.id === where.id) ?? null;
      }),
      findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return templates.find((t) => Object.entries(where).every(([k, v]) => t[k] === v)) ?? null;
      }),
      count: jest.fn(async ({ where }: { where?: Record<string, unknown> }) => {
        if (!where) return templates.length;
        return templates.filter((t) => Object.entries(where).every(([k, v]) => t[k] === v)).length;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = templates.findIndex((t) => t.id === where.id);
        if (idx === -1) return null;
        templates[idx] = { ...templates[idx], ...data, updatedAt: new Date() };
        return templates[idx];
      }),
      delete: jest.fn(async ({ where }: { where: { id: string } }) => {
        const idx = templates.findIndex((t) => t.id === where.id);
        if (idx === -1) return null;
        const [removed] = templates.splice(idx, 1);
        return removed;
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
  };

  return mocks;
}

describe('TemplatesController (e2e)', () => {
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

  describe('POST /api/templates', () => {
    it('creates a template', async () => {
      const res = await request(app.getHttpServer())
        .post('/templates')
        .send({
          name: 'Health Ordinance Template',
          category: 'Health',
          jurisdiction: ['barangay'],
          structure: { sections: [] },
          isPublic: true,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Health Ordinance Template',
        category: 'Health',
      });
      expect(res.body.id).toBeDefined();
    });
  });

  describe('GET /api/templates', () => {
    it('returns paginated templates', async () => {
      const res = await request(app.getHttpServer())
        .get('/templates')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('filters by category', async () => {
      const res = await request(app.getHttpServer())
        .get('/templates?category=Health')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    it('deletes a template', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/templates')
        .send({
          name: 'Temp To Delete',
          category: 'Other',
          jurisdiction: ['city'],
          structure: { sections: [] },
          isPublic: false,
        });

      const templateId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/templates/${templateId}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/templates/${templateId}`)
        .expect(404);
    });
  });
});
