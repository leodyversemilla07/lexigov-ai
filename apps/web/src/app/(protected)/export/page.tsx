'use client';

import { Suspense } from 'react';
import { ExportPageContent, ExportLoading } from './_components/export-manager';

export default function ExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <ExportPageContent />
    </Suspense>
  );
}
