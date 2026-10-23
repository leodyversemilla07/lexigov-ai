import { UserRole } from '@lexigov/shared';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from './password.util';

export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminUserListResult {
  data: Array<Record<string, unknown>>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: AdminUserListQuery = {}): Promise<AdminUserListResult> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const page = Math.max(query.page ?? 1, 1);
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { name: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data as unknown as Array<Record<string, unknown>>,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.delete({ where: { id } });
  }

  /**
   * Creates a user, and — when a password is supplied — a Better Auth
   * `credential` account so the user can sign in with email and password.
   */
  async createUser(dto: { email: string; password?: string; name?: string; role?: UserRole }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with that email already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          role: dto.role ?? 'CITIZEN_VIEWER',
          emailVerified: false,
        },
      });

      if (dto.password) {
        await tx.account.create({
          data: {
            accountId: user.id,
            providerId: 'credential',
            userId: user.id,
            password: await hashPassword(dto.password),
          },
        });
      }

      return user;
    });
  }
}
