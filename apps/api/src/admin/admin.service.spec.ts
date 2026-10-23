import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new AdminService(prisma as unknown as ConstructorParameters<typeof AdminService>[0]);
  });

  describe('listUsers', () => {
    it('returns a paginated user list', async () => {
      const users = [{ id: 'user_1', email: 'admin@lexigov.ph' }];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers({ page: 1, limit: 20, search: undefined });

      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
      expect(result.data).toEqual(users);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies search filters when provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.listUsers({ page: 1, limit: 20, search: 'maria' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              expect.objectContaining({ email: expect.objectContaining({ contains: 'maria' }) }),
              expect.objectContaining({ name: expect.objectContaining({ contains: 'maria' }) }),
            ],
          }),
        }),
      );
      expect(result.total).toBe(0);
    });
  });

  describe('getUser', () => {
    it('returns the user when found', async () => {
      const user = { id: 'user_1', email: 'admin@lexigov.ph', role: 'ADMIN' };
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.getUser('user_1')).resolves.toEqual(user);
    });

    it('throws when the user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUser('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserRole', () => {
    it('updates the user role', async () => {
      const user = { id: 'user_1', email: 'admin@lexigov.ph', role: 'ADMIN' };
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, role: 'PRESIDING_OFFICER' });

      await expect(service.updateUserRole('user_1', 'PRESIDING_OFFICER')).resolves.toEqual({
        ...user,
        role: 'PRESIDING_OFFICER',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user_1' }, data: { role: 'PRESIDING_OFFICER' } });
    });

    it('throws when the user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUserRole('missing', 'ADMIN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('deletes the user when found', async () => {
      const user = { id: 'user_1', email: 'admin@lexigov.ph', role: 'ADMIN' };
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.delete.mockResolvedValue(user);

      await expect(service.deleteUser('user_1')).resolves.toEqual(user);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user_1' } });
    });

    it('throws when the user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
