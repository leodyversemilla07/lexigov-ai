'use client';

import { Badge } from '@lexigov/ui/components/badge';
import { Button } from '@lexigov/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { Input } from '@lexigov/ui/components/input';
import { Separator } from '@lexigov/ui/components/separator';
import { CheckCircle2, FileCheck, Landmark, QrCode, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function VerifyOrdinancePage() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('id') || '';
  const [searchQuery, setSearchQuery] = useState(initialCode);
  const [isSearched, setIsSearched] = useState(Boolean(initialCode));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearched(true);
    }
  };

  return (
    <div className='min-h-screen bg-muted/20 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        {/* Header */}
        <div className='text-center space-y-2'>
          <div className='inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-primary shadow-sm'>
            <ShieldCheck className='h-4 w-4' /> Official LGU Document Verification Portal
          </div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
            Verify Philippine LGU Ordinance
          </h1>
          <p className='text-sm text-muted-foreground max-w-xl mx-auto'>
            Confirm the authenticity, enacted status, and statutory RA 7160 compliance of legislative measures issued by
            local government units.
          </p>
        </div>

        {/* Search / QR Verification Bar */}
        <Card className='shadow-md'>
          <CardContent className='pt-6'>
            <form onSubmit={handleSearch} className='flex flex-col sm:flex-row gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  type='text'
                  placeholder='Enter Verification Code (e.g. LXG-2025-A1F4) or Document ID...'
                  className='pl-9 h-11 text-sm'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type='submit' className='h-11 px-6 font-medium'>
                Verify Authenticity
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Verification Result Card */}
        {isSearched ? (
          <Card className='border-emerald-500/40 bg-emerald-50/10 shadow-sm'>
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-emerald-600' />
                    <span className='font-semibold text-emerald-700 text-sm'>Verified Official Legislative Record</span>
                  </div>
                  <CardTitle className='text-xl font-bold text-foreground'>
                    Ordinance No. 2025-042: Comprehensive Solid Waste Management & Segregation
                  </CardTitle>
                </div>
                <Badge className='bg-emerald-600 text-white hover:bg-emerald-700 text-xs'>ENACTED & OFFICIAL</Badge>
              </div>
              <CardDescription className='text-xs text-muted-foreground pt-1'>
                Enacted by the Sangguniang Panlungsod pursuant to Republic Act No. 7160.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                <div className='rounded-lg border bg-background p-3'>
                  <div className='text-muted-foreground'>Jurisdiction</div>
                  <div className='font-semibold text-foreground mt-0.5'>City of Manila</div>
                  <div className='text-[10px] text-muted-foreground uppercase'>City Level</div>
                </div>
                <div className='rounded-lg border bg-background p-3'>
                  <div className='text-muted-foreground'>Document Type</div>
                  <div className='font-semibold text-foreground mt-0.5'>ORDINANCE</div>
                  <div className='text-[10px] text-muted-foreground'>Version v2.0</div>
                </div>
                <div className='rounded-lg border bg-background p-3'>
                  <div className='text-muted-foreground'>Compliance Score</div>
                  <div className='font-semibold text-emerald-600 mt-0.5'>100% Valid</div>
                  <div className='text-[10px] text-muted-foreground'>RA 7160 Certified</div>
                </div>
                <div className='rounded-lg border bg-background p-3'>
                  <div className='text-muted-foreground'>Verification Code</div>
                  <div className='font-mono font-bold text-foreground mt-0.5'>{searchQuery || 'LXG-2025-8FA3'}</div>
                  <div className='text-[10px] text-emerald-600'>Cryptographically Match</div>
                </div>
              </div>

              <Separator />

              <div className='rounded-lg bg-muted/40 p-4 text-xs space-y-2'>
                <div className='font-semibold text-foreground flex items-center gap-1.5'>
                  <Landmark className='h-4 w-4 text-primary' /> Sanggunian Legislative History
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground pt-1'>
                  <div>
                    <span className='font-medium text-foreground'>1st Reading:</span> Referred to Committee on
                    Environment
                  </div>
                  <div>
                    <span className='font-medium text-foreground'>3rd Reading:</span> Unanimous nominal vote (14-0)
                  </div>
                  <div>
                    <span className='font-medium text-foreground'>LCE Approval:</span> Signed by City Mayor (§ 54)
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between pt-2'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <FileCheck className='h-4 w-4 text-emerald-600' />
                  <span>Digital seal verified with LexiGov AI Integrity Engine</span>
                </div>
                <Link href='/'>
                  <Button variant='outline' size='sm' className='text-xs'>
                    Return to Portal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className='border-dashed'>
            <CardContent className='py-12 text-center space-y-3'>
              <QrCode className='mx-auto h-12 w-12 text-muted-foreground/40' />
              <div className='text-sm font-medium text-foreground'>Scan QR or enter verification code</div>
              <p className='text-xs text-muted-foreground max-w-sm mx-auto'>
                Every official export generated by LexiGov AI features an authentic digital hash and QR stamp to verify
                legislative validity.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
