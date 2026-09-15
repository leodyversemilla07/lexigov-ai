import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports readiness when the database query succeeds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const controller = new HealthController(prisma as never);

    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      services: { database: 'ok' },
    });
  });

  it('fails readiness with HTTP 503 semantics when the database is unavailable', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('database unavailable')) };
    const controller = new HealthController(prisma as never);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
