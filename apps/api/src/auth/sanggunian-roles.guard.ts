import type { SanggunianRole } from '@lexigov/shared';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './auth.service';
import { requireOrganizationMembership, resolveStoredRole } from './organization-access';
import { SANGGUNIAN_ROLES_KEY } from './sanggunian-roles.decorator';

interface RoleRequest {
  user?: AuthenticatedUser;
  headers: Record<string, unknown>;
  body?: { organizationId?: unknown };
  query?: { organizationId?: unknown };
  effectiveRole?: SanggunianRole;
}

@Injectable()
export class SanggunianRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SanggunianRole[]>(SANGGUNIAN_ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<RoleRequest>();
    if (!request.user?.userId) throw new UnauthorizedException('Authentication required');

    // The tenant is a requested context, never proof of access. Services must additionally
    // check the organization stored on the target resource. Role headers are never trusted.
    const organizationId =
      request.headers['x-organization-id'] ?? request.body?.organizationId ?? request.query?.organizationId;
    if (organizationId !== undefined && (typeof organizationId !== 'string' || !organizationId)) {
      throw new ForbiddenException('Invalid organization context');
    }
    const membership = await requireOrganizationMembership(this.prisma, organizationId, request.user.userId);
    const effectiveRole = resolveStoredRole(membership?.role ?? request.user.role);
    if (!effectiveRole || (effectiveRole !== 'LGU_ADMIN' && !requiredRoles.includes(effectiveRole))) {
      throw new ForbiddenException('Insufficient Sanggunian role');
    }
    request.effectiveRole = effectiveRole;
    return true;
  }
}
