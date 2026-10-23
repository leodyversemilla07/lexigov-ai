'use client';

import { Button } from '@lexigov/ui/components/button';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { type AssignableOrganizationRole, assignableOrganizationRoles } from '@/lib/organization-permissions';

interface OrganizationMemberView {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

interface OrganizationManagementProps {
  organization: { id: string; name: string } | null | undefined;
  onOrganizationChanged: () => Promise<unknown>;
}

function roleLabel(role: string): string {
  if (role === 'owner') return 'Organization owner';
  if (role === 'admin') return 'LGU administrator';
  return assignableOrganizationRoles.find((item) => item.value === role)?.label ?? role;
}

export function OrganizationManagement({ organization, onOrganizationChanged }: OrganizationManagementProps) {
  const [members, setMembers] = useState<OrganizationMemberView[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableOrganizationRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = activeRole.split(',').some((role) => role === 'owner' || role === 'admin');

  const loadMembers = useCallback(async () => {
    if (!organization) {
      setMembers([]);
      setActiveRole('');
      setActiveMemberId(null);
      return;
    }
    setIsLoadingMembers(true);
    try {
      const [memberResult, activeMemberResult] = await Promise.all([
        authClient.organization.listMembers({ query: { organizationId: organization.id, limit: 100 } }),
        authClient.organization.getActiveMember({ query: { organizationId: organization.id } }),
      ]);
      if (memberResult.error) throw new Error(memberResult.error.message || 'Unable to load members');
      if (activeMemberResult.error) throw new Error(activeMemberResult.error.message || 'Unable to load your role');
      setMembers((memberResult.data?.members ?? []) as OrganizationMemberView[]);
      setActiveRole(activeMemberResult.data?.role ?? '');
      setActiveMemberId(activeMemberResult.data?.id ?? null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to load organization members.');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [organization]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const createOrganization = async () => {
    const name = organizationName.trim();
    const slug = organizationSlug.trim().toLowerCase();
    if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast.error('Enter a name and a lowercase slug using letters, numbers, and hyphens.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await authClient.organization.create({ name, slug });
      if (result.error) throw new Error(result.error.message || 'Unable to create organization');
      if (result.data?.id) await authClient.organization.setActive({ organizationId: result.data.id });
      await onOrganizationChanged();
      toast.success('Organization workspace created.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to create organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inviteMember = async () => {
    if (!organization || !inviteEmail.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await authClient.organization.inviteMember({
        organizationId: organization.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      if (result.error) throw new Error(result.error.message || 'Unable to send invitation');
      setInviteEmail('');
      toast.success('Invitation sent.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRole = async (memberId: string, role: AssignableOrganizationRole) => {
    if (!organization) return;
    try {
      const result = await authClient.organization.updateMemberRole({
        organizationId: organization.id,
        memberId,
        role,
      });
      if (result.error) throw new Error(result.error.message || 'Unable to update member role.');
      await loadMembers();
      toast.success('Member role updated.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update member role.');
    }
  };

  const removeMember = async (member: OrganizationMemberView) => {
    if (!organization || member.id === activeMemberId) return;
    try {
      const result = await authClient.organization.removeMember({
        organizationId: organization.id,
        memberIdOrEmail: member.id,
      });
      if (result.error) throw new Error(result.error.message || 'Unable to remove member.');
      await loadMembers();
      toast.success('Member removed.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to remove member.');
    }
  };

  if (!organization) {
    return (
      <div className='space-y-4 rounded-lg border bg-muted/20 p-4'>
        <div>
          <p className='font-medium'>Create an LGU workspace</p>
          <p className='text-xs text-muted-foreground'>The creator becomes the organization owner.</p>
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='new-organization-name'>Organization name</Label>
            <Input
              id='new-organization-name'
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              maxLength={200}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='new-organization-slug'>Workspace slug</Label>
            <Input
              id='new-organization-slug'
              value={organizationSlug}
              onChange={(event) => setOrganizationSlug(event.target.value)}
              placeholder='sample-city-council'
              maxLength={100}
            />
          </div>
        </div>
        <Button onClick={createOrganization} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null} Create workspace
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <div className='rounded-lg border bg-muted/20 p-3 text-sm'>
        Your role: <strong>{roleLabel(activeRole)}</strong>. Workspace roles control application capabilities only and
        do not verify public office.
      </div>

      {canManage ? (
        <div className='space-y-3 rounded-lg border p-4'>
          <div className='flex items-center gap-2 font-medium'>
            <UserPlus className='h-4 w-4' /> Invite a member
          </div>
          <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px_auto]'>
            <Input
              type='email'
              aria-label='Invitation email'
              placeholder='official@example.gov.ph'
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as AssignableOrganizationRole)}>
              <SelectTrigger aria-label='Invitation role'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableOrganizationRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={inviteMember} disabled={isSubmitting || !inviteEmail.trim()}>
              Invite
            </Button>
          </div>
        </div>
      ) : null}

      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <p className='font-medium'>Members</p>
          <span className='text-xs text-muted-foreground'>{members.length} listed</span>
        </div>
        {isLoadingMembers ? <p className='text-sm text-muted-foreground'>Loading members…</p> : null}
        {members.map((member) => {
          const protectedMember = member.role.split(',').includes('owner') || member.id === activeMemberId;
          return (
            <div
              key={member.id}
              className='flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{member.user.name || member.user.email}</p>
                <p className='truncate text-xs text-muted-foreground'>{member.user.email}</p>
              </div>
              <div className='flex items-center gap-2'>
                {canManage && !protectedMember ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => void updateRole(member.id, value as AssignableOrganizationRole)}
                  >
                    <SelectTrigger className='w-[210px]' aria-label={`Role for ${member.user.email}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='admin'>LGU administrator</SelectItem>
                      {assignableOrganizationRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <BadgeLike>{roleLabel(member.role)}</BadgeLike>
                )}
                {canManage && !protectedMember ? (
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={`Remove ${member.user.email}`}
                    onClick={() => void removeMember(member)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeLike({ children }: { children: string }) {
  return <span className='rounded-full border bg-muted px-2.5 py-1 text-xs'>{children}</span>;
}
