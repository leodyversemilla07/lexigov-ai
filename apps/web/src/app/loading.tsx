import { Skeleton } from '@lexigov/ui/components/skeleton';

export default function RootLoading() {
  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-md space-y-4'>
        <Skeleton className='mx-auto size-16 rounded-full' />
        <Skeleton className='h-8 w-3/4 mx-auto' />
        <Skeleton className='h-4 w-1/2 mx-auto' />
        <Skeleton className='h-40 w-full' />
      </div>
    </div>
  );
}
