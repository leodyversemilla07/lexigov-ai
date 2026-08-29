'use client';

import { Suspense } from 'react';
import { TemplatesLoading, TemplatesPageContent } from './_components/templates-list';

export default function TemplatesPage() {
  return (
    <Suspense fallback={<TemplatesLoading />}>
      <TemplatesPageContent />
    </Suspense>
  );
}
