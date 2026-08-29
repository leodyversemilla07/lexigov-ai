import { isSanggunianRole, type SanggunianRole, toSanggunianRole } from '@lexigov/shared';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { SANGGUNIAN_ROLES_KEY } from './sanggunian-roles.decorator';

@Injectable()
export class SanggunianRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SanggunianRole[]>(SANGGUNIAN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check header override (useful for testing and active role context)
    const headerRole = request.headers['x-sanggunian-role'];
    if (headerRole && isSanggunianRole(headerRole)) {
      request.effectiveRole = headerRole;
      if (headerRole === 'LGU_ADMIN' || requiredRoles.includes(headerRole)) {
        return true;
      }
    }

    const organizationId =
      request.headers['x-organization-id'] || request.body?.organizationId || request.query?.organizationId;

    let effectiveRole: SanggunianRole = 'LEGISLATIVE_STAFF';

    if (organizationId && typeof organizationId === 'string') {
      const membership = await this.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: user.id,
          },
        },
      });

      if (membership?.role) {
        effectiveRole = toSanggunianRole(membership.role, 'LEGISLATIVE_STAFF');
      }
    } else if (user.role) {
      effectiveRole = toSanggunianRole(user.role, 'LEGISLATIVE_STAFF');
    }

    request.effectiveRole = effectiveRole;

    if (effectiveRole === 'LGU_ADMIN' || user.role === 'ADMIN' || requiredRoles.includes(effectiveRole)) {
      return true;
    }

    throw new ForbiddenException(
      `Insufficient Sanggunian role: Action requires one of [${requiredRoles.join(', ')}], current role is '${effectiveRole}'.`,
    );
  }
}
