'use client';

import { Button } from '@lexigov/ui/components/button';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Loader2, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    setError('');
    setLoading(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (resetError) {
      setError(resetError.message || 'Failed to reset password');
      setLoading(false);
    } else {
      router.push('/sign-in');
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4'>
      <div className='w-full max-w-sm'>
        <div className='rounded-xl border bg-white dark:bg-slate-950 shadow-lg p-8'>
          <div className='mb-8 text-center'>
            <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4'>
              <Lock className='size-6 text-primary' />
            </div>
            <h1 className='text-2xl font-bold tracking-tight'>Reset password</h1>
            <p className='text-sm text-muted-foreground mt-1'>Choose a new password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <Input
                id='password'
                type='password'
                placeholder='At least 8 characters'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete='new-password'
              />
            </div>

            {error && <p className='text-sm text-destructive'>{error}</p>}

            <Button type='submit' className='w-full' disabled={loading || !token}>
              {loading && <Loader2 className='size-4 mr-2 animate-spin' />}
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
