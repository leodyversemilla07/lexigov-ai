import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui';
import { ShieldAlert } from 'lucide-react';

/** Fail closed until an authoritative, versioned publication registry is implemented. */
export default function VerifyOrdinancePage() {
  return (
    <main className='flex min-h-screen items-center justify-center bg-muted/20 px-4 py-12'>
      <Card className='w-full max-w-xl'>
        <CardHeader>
          <ShieldAlert className='mb-2 h-8 w-8 text-amber-600' aria-hidden='true' />
          <CardTitle>Document verification unavailable</CardTitle>
          <CardDescription>
            LexiGov does not currently authenticate published ordinances or certify their legal validity.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <p>
            No document has been verified by this page. Codes, fingerprints, and links on previously generated exports
            are not proof of enactment, official signatures, or RA 7160 compliance.
          </p>
          <p>
            Contact the issuing LGU or Secretary to the Sanggunian and request the official record before relying on a
            document. LexiGov exports are working drafts that require authorized review.
          </p>
          <Button variant='outline' asChild>
            <Link href='/'>Return to LexiGov</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
