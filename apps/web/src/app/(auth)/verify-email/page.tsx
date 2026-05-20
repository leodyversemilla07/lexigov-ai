import { MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4'>
      <div className='w-full max-w-sm text-center'>
        <div className='rounded-xl border bg-white dark:bg-slate-950 shadow-lg p-8'>
          <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4'>
            <MailCheck className='size-6 text-primary' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>Check your email</h1>
          <p className='text-sm text-muted-foreground mt-2'>
            We&apos;ve sent a verification link. Please check your inbox and click the link to activate your account.
          </p>
          <p className='text-xs text-muted-foreground mt-4'>
            Didn&apos;t receive it?{' '}
            <Link href='/sign-in' className='font-medium text-primary hover:underline'>
              Try signing in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
