'use client';

import { Button } from '@lexigov/ui/components/button';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Loader2, Scale } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from '@/lib/auth-client';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn.email({
      email,
      password,
      callbackURL: '/dashboard',
    });

    if (signInError) {
      setError(signInError.message || 'Invalid credentials');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4'>
      <div className='w-full max-w-sm'>
        <div className='rounded-xl border bg-white dark:bg-slate-950 shadow-lg p-8'>
          <div className='mb-8 text-center'>
            <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4'>
              <Scale className='size-6 text-primary' />
            </div>
            <h1 className='text-2xl font-bold tracking-tight'>Welcome back</h1>
            <p className='text-sm text-muted-foreground mt-1'>Sign in to LexiGov</p>
          </div>

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
                autoComplete='email'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Password</Label>
                <Link href='/forgot-password' className='text-xs text-muted-foreground hover:text-primary'>
                  Forgot password?
                </Link>
              </div>
              <Input
                id='password'
                type='password'
                placeholder='Enter your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
              />
            </div>

            {error && <p className='text-sm text-destructive'>{error}</p>}

            <Button type='submit' className='w-full' disabled={loading}>
              {loading && <Loader2 className='size-4 mr-2 animate-spin' />}
              Sign In
            </Button>
          </form>

          <p className='mt-6 text-center text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link href='/sign-up' className='font-medium text-primary hover:underline'>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
