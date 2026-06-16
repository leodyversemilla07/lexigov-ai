'use client';

import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='mx-auto max-w-md text-center'>
        <CardHeader>
          <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100'>
            <AlertTriangle className='size-8 text-red-600' />
          </div>
          <CardTitle className='text-2xl'>Something went wrong</CardTitle>
          <CardDescription>An unexpected error occurred. Our team has been notified.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error.digest && (
            <p className='text-xs text-muted-foreground'>
              Error ID: <code className='font-mono'>{error.digest}</code>
            </p>
          )}
          <Button onClick={reset}>
            <RefreshCw className='mr-2 size-4' />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
