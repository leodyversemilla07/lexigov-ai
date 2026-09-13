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
  it('does not convert read-oriented researcher roles into legislative staff', () => {
    expect(resolveStoredRole('researcher')).toBeNull();
    expect(resolveStoredRole('citizen_viewer')).toBeNull();
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
});
