'use client';

import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Loader2, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { authClient } from '@/lib/auth-client';

function InvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('id');
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = async () => {
    if (!invitationId) return;
    setIsAccepting(true);
    setError(null);
    try {
      const result = await authClient.organization.acceptInvitation({ invitationId });
      if (result.error) throw new Error(result.error.message || 'Unable to accept invitation');
      if (result.data?.invitation.organizationId) {
        await authClient.organization.setActive({ organizationId: result.data.invitation.organizationId });
      }
      router.replace('/settings');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to accept invitation.');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className='mx-auto max-w-lg py-12'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' /> Organization invitation
          </CardTitle>
          <CardDescription>
            Joining grants the workspace role selected by an organization administrator. It does not establish public
            office or legal authority.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {!invitationId ? <p className='text-sm text-destructive'>The invitation link is incomplete.</p> : null}
          {error ? <p className='text-sm text-destructive'>{error}</p> : null}
          <Button onClick={acceptInvitation} disabled={!invitationId || isAccepting}>
            {isAccepting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            Accept invitation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className='py-12 text-center text-sm text-muted-foreground'>Loading invitation…</div>}>
      <InvitationContent />
    </Suspense>
  );
}
