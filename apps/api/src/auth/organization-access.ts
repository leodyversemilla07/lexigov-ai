import { isSanggunianRole, type SanggunianRole } from '@lexigov/shared';
import { ForbiddenException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';

/** Only call this with roles read from a verified session or a persisted membership. */
export function resolveStoredRole(value: unknown): SanggunianRole | null {
  if (typeof value !== 'string') return null;
  const role = value.toUpperCase();
  if (isSanggunianRole(role)) return role;
  if (role === 'ADMIN' || role === 'OWNER') return 'LGU_ADMIN';
  if (role === 'BARANGAY_SECRETARY') return 'SANGGUNIAN_SECRETARY';
  if (['USER', 'MEMBER', 'RESEARCHER', 'CITY_COUNCIL'].includes(role)) return 'LEGISLATIVE_STAFF';
  return null;
}

export async function requireOrganizationMembership(
  prisma: Pick<Prisma.TransactionClient, 'member'>,
  organizationId: string | null | undefined,
  userId: string,
) {
  if (!userId) throw new ForbiddenException('Authentication required');
  if (!organizationId) return null;
  const member = await prisma.member.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  if (!member) throw new ForbiddenException('Organization membership required');
  return member;
}

export async function requireDraftWriteRole(
  prisma: Pick<Prisma.TransactionClient, 'member' | 'user'>,
  organizationId: string | null | undefined,
  userId: string,
): Promise<SanggunianRole> {
  const member = await requireOrganizationMembership(prisma, organizationId, userId);
  const storedRole = member
    ? member.role
    : (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role;
  const role = resolveStoredRole(storedRole);
  if (!role) throw new ForbiddenException('Your role does not permit draft changes');
  return role;
}
