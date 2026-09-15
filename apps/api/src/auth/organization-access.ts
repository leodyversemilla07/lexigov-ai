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
  // Personal accounts retain drafting access through the core `user` role. Generic organization
  // members and ambiguous legacy council labels are intentionally read-only.
  if (role === 'USER') return 'LEGISLATIVE_STAFF';
  return null;
}

export async function hasOrganizationResourceAccess(
  prisma: Pick<Prisma.TransactionClient, 'member'>,
  organizationId: string | null | undefined,
  ownerId: string,
  userId: string,
): Promise<boolean> {
  if (!userId) return false;
  if (!organizationId) return ownerId === userId;
  const member = await prisma.member.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  return Boolean(member);
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

export async function resolveDraftResourceRole(
  prisma: Pick<Prisma.TransactionClient, 'member' | 'user'>,
  organizationId: string | null | undefined,
  userId: string,
): Promise<SanggunianRole | null> {
  const member = await requireOrganizationMembership(prisma, organizationId, userId);
  const storedRole = member
    ? member.role
    : (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role;
  return resolveStoredRole(storedRole);
}

export async function requireDraftWriteRole(
  prisma: Pick<Prisma.TransactionClient, 'member' | 'user'>,
  organizationId: string | null | undefined,
  userId: string,
): Promise<SanggunianRole> {
  const role = await resolveDraftResourceRole(prisma, organizationId, userId);
  if (!role) throw new ForbiddenException('Your role does not permit draft changes');
  return role;
}
