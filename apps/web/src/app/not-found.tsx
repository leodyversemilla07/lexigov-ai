'use client';

import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='mx-auto max-w-md text-center'>
        <CardHeader>
          <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100'>
            <FileQuestion className='size-8 text-amber-600' />
          </div>
          <CardTitle className='text-2xl'>Page Not Found</CardTitle>
          <CardDescription>The page you&apos;re looking for doesn&apos;t exist or has been moved.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href='/dashboard'>
              <Home className='mr-2 size-4' />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
