import type { AccessControl, Role } from 'better-auth/plugins/access';
import { defaultAc, defaultRoles } from 'better-auth/plugins/organization/access';

const readOnlyOrganizationRole = defaultAc.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ['read'],
});

// Better Auth 1.6 exposes non-generic client option interfaces even though access controls
// are statement-generic. Keep the runtime objects and widen only at the plugin boundary.
export const organizationAccessControl = defaultAc as unknown as AccessControl;

export const organizationRoles = {
  ...defaultRoles,
  legislative_staff: readOnlyOrganizationRole,
  committee_chair: readOnlyOrganizationRole,
  sanggunian_secretary: readOnlyOrganizationRole,
  presiding_officer: readOnlyOrganizationRole,
  lce_office: readOnlyOrganizationRole,
} as unknown as Record<string, Role>;

export const assignableOrganizationRoles = [
  { value: 'member', label: 'Viewer (read-only)' },
  { value: 'legislative_staff', label: 'Legislative staff' },
  { value: 'committee_chair', label: 'Committee chairperson' },
  { value: 'sanggunian_secretary', label: 'Secretary to the Sanggunian' },
  { value: 'presiding_officer', label: 'Presiding officer' },
  { value: 'lce_office', label: 'Local chief executive office' },
] as const;

export type AssignableOrganizationRole = (typeof assignableOrganizationRoles)[number]['value'];
