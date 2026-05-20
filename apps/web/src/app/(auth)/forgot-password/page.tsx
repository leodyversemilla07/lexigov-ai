'use client';

import { Button } from '@lexigov/ui/components/button';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: '/reset-password',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data?.error?.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4'>
      <div className='w-full max-w-sm'>
        <div className='rounded-xl border bg-white dark:bg-slate-950 shadow-lg p-8'>
          <div className='mb-8 text-center'>
            <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4'>
              <KeyRound className='size-6 text-primary' />
            </div>
            {sent ? (
              <>
                <h1 className='text-2xl font-bold tracking-tight'>Check your email</h1>
                <p className='text-sm text-muted-foreground mt-1'>
                  If an account exists for {email}, you&apos;ll receive a password reset link.
                </p>
              </>
            ) : (
              <>
                <h1 className='text-2xl font-bold tracking-tight'>Forgot password?</h1>
                <p className='text-sm text-muted-foreground mt-1'>Enter your email to receive a reset link</p>
              </>
            )}
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='name@example.gov.ph'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className='text-sm text-destructive'>{error}</p>}

              <Button type='submit' className='w-full' disabled={loading}>
                {loading && <Loader2 className='size-4 mr-2 animate-spin' />}
                Send Reset Link
              </Button>
            </form>
          )}

          <div className='mt-6 text-center'>
            <Link
              href='/sign-in'
              className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary'
            >
              <ArrowLeft className='size-3' />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
