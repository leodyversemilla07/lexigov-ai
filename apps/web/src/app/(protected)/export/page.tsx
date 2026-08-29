'use client';

import { Suspense } from 'react';
import { ExportLoading, ExportPageContent } from './_components/export-manager';

export default function ExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <ExportPageContent />
    </Suspense>
  );
}
