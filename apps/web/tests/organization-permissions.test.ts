import { describe, expect, it } from 'vitest';
import { assignableOrganizationRoles, organizationRoles } from '@/lib/organization-permissions';

describe('organization role configuration', () => {
  it('registers every explicit legislative workspace role with Better Auth', () => {
    expect(Object.keys(organizationRoles)).toEqual(
      expect.arrayContaining([
        'owner',
        'admin',
        'member',
        'legislative_staff',
        'committee_chair',
        'sanggunian_secretary',
        'presiding_officer',
        'lce_office',
      ]),
    );
  });

  it('keeps owner and administrator roles out of ordinary invitations', () => {
    const values = assignableOrganizationRoles.map((role) => role.value);
    expect(values).toContain('member');
    expect(values).not.toContain('owner');
    expect(values).not.toContain('admin');
  });
});
