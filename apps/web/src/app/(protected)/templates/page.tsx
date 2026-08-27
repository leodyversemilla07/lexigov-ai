'use client';

import { Suspense } from 'react';
import { TemplatesPageContent, TemplatesLoading } from './_components/templates-list';

export default function TemplatesPage() {
  return (
    <Suspense fallback={<TemplatesLoading />}>
      <TemplatesPageContent />
    </Suspense>
  );
}
