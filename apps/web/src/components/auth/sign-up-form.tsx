'use client';

import { Button } from '@lexigov/ui/components/button';
import { Input } from '@lexigov/ui/components/input';
import { Label } from '@lexigov/ui/components/label';
import { Loader2, Scale } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signUp } from '@/lib/auth-client';

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
      callbackURL: '/verify-email',
    });

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account');
      setLoading(false);
    } else {
      router.push('/verify-email');
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
            <h1 className='text-2xl font-bold tracking-tight'>Create an account</h1>
            <p className='text-sm text-muted-foreground mt-1'>Start drafting compliant ordinances</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                type='text'
                placeholder='Juan Dela Cruz'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete='name'
              />
            </div>

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
              <Label htmlFor='password'>Password</Label>
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

            <Button type='submit' className='w-full' disabled={loading}>
              {loading && <Loader2 className='size-4 mr-2 animate-spin' />}
              Create Account
            </Button>
          </form>

          <p className='mt-6 text-center text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link href='/sign-in' className='font-medium text-primary hover:underline'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
