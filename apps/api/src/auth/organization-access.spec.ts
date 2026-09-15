import { ForbiddenException } from '@nestjs/common';
import { hasOrganizationResourceAccess, requireDraftWriteRole, resolveStoredRole } from './organization-access';

function prismaWithMembership(role: string | null) {
  return {
    member: {
      findUnique: jest.fn(async () => (role ? { role } : null)),
    },
    user: {
      findUnique: jest.fn(async () => ({ role: role ?? 'researcher' })),
    },
  };
}

describe('organization access policy', () => {
  it('keeps generic and read-oriented organization roles read-only', () => {
    expect(resolveStoredRole('member')).toBeNull();
    expect(resolveStoredRole('researcher')).toBeNull();
    expect(resolveStoredRole('citizen_viewer')).toBeNull();
    expect(resolveStoredRole('city_council')).toBeNull();
  });

  it('maps explicit persisted organization roles to their drafting capabilities', () => {
    expect(resolveStoredRole('legislative_staff')).toBe('LEGISLATIVE_STAFF');
    expect(resolveStoredRole('committee_chair')).toBe('COMMITTEE_CHAIR');
    expect(resolveStoredRole('sanggunian_secretary')).toBe('SANGGUNIAN_SECRETARY');
    expect(resolveStoredRole('presiding_officer')).toBe('PRESIDING_OFFICER');
    expect(resolveStoredRole('lce_office')).toBe('LCE_OFFICE');
    expect(resolveStoredRole('admin')).toBe('LGU_ADMIN');
  });

  it('permits personal resources only for their owner', async () => {
    const prisma = prismaWithMembership(null);
    await expect(hasOrganizationResourceAccess(prisma as never, null, 'owner', 'owner')).resolves.toBe(true);
    await expect(hasOrganizationResourceAccess(prisma as never, null, 'owner', 'other')).resolves.toBe(false);
    expect(prisma.member.findUnique).not.toHaveBeenCalled();
  });

  it('permits organization resources only for persisted members', async () => {
    await expect(
      hasOrganizationResourceAccess(prismaWithMembership('member') as never, 'org_1', 'author', 'member'),
    ).resolves.toBe(true);
    await expect(
      hasOrganizationResourceAccess(prismaWithMembership(null) as never, 'org_1', 'author', 'outsider'),
    ).resolves.toBe(false);
  });

  it('rejects researcher-only accounts from draft mutations', async () => {
    await expect(requireDraftWriteRole(prismaWithMembership(null) as never, null, 'researcher')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows generic organization members to read but not mutate shared drafts', async () => {
    const prisma = prismaWithMembership('member');
    await expect(hasOrganizationResourceAccess(prisma as never, 'org_1', 'author', 'viewer')).resolves.toBe(true);
    await expect(requireDraftWriteRole(prisma as never, 'org_1', 'viewer')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
