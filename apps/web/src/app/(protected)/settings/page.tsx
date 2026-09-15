'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@lexigov/ui/components/avatar';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Separator } from '@lexigov/ui/components/separator';
import { Building, Loader2, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authClient, signOut, useSession } from '@/lib/auth-client';
import { OrganizationManagement } from './_components/organization-management';

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: organization, isPending: isOrganizationLoading, refetch: refetchOrganization } =
    authClient.useActiveOrganization();
  const [organizationName, setOrganizationName] = useState('');
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const user = session?.user;

  useEffect(() => {
    setOrganizationName(organization?.name ?? '');
  }, [organization?.name]);

  const saveOrganization = async () => {
    const name = organizationName.trim();
    if (!organization || !name || name === organization.name) return;
    setIsSavingOrganization(true);
    try {
      const result = await authClient.organization.update({
        organizationId: organization.id,
        data: { name },
      });
      if (result.error) throw new Error(result.error.message || 'Unable to update organization');
      await refetchOrganization();
      toast.success('Organization name updated.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update organization.');
    } finally {
      setIsSavingOrganization(false);
    }
  };

  const displayName = user?.name ?? 'User';
  const email = user?.email ?? '';
  const imageUrl = user?.image ?? undefined;

  return (
    <div className='space-y-6 max-w-2xl'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>App Settings</h1>
        <p className='text-muted-foreground'>Manage application-specific preferences and organization details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Profile Reference
          </CardTitle>
          <CardDescription>Read-only identity details from your account profile</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src={imageUrl} alt={displayName} />
              <AvatarFallback className='text-lg'>{getInitials(displayName, email)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className='font-semibold'>{displayName}</h3>
              <p className='text-sm text-muted-foreground'>{email}</p>
            </div>
          </div>

          <Separator />

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Display Name</Label>
              <Input id='name' defaultValue={displayName} disabled placeholder='Your name' />
              <p className='text-xs text-muted-foreground'>Manage your name from the dedicated Account page.</p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' defaultValue={email} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='h-5 w-5' />
            Organization
          </CardTitle>
          <CardDescription>Update the active LGU workspace if your membership role permits it</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='org'>LGU / Organization Name</Label>
            <Input
              id='org'
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder={isOrganizationLoading ? 'Loading organization...' : 'No active organization'}
              disabled={isOrganizationLoading || !organization || isSavingOrganization}
              maxLength={200}
            />
          </div>
          {organization ? (
            <Button
              onClick={saveOrganization}
              disabled={
                isOrganizationLoading ||
                isSavingOrganization ||
                !organizationName.trim() ||
                organizationName.trim() === organization.name
              }
            >
              {isSavingOrganization ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Save Changes
            </Button>
          ) : null}
          {!isOrganizationLoading ? (
            <>
              <Separator />
              <OrganizationManagement organization={organization} onOrganizationChanged={refetchOrganization} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Session
          </CardTitle>
          <CardDescription>Manage your current session on this device</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-destructive'>Sign Out</p>
              <p className='text-sm text-muted-foreground'>Sign out of your account on this device</p>
            </div>
            <Button
              variant='outline'
              onClick={async () => {
                await signOut();
                router.push('/');
                router.refresh();
              }}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
