'use client';

import { Suspense } from 'react';
import { ComplianceLoading, CompliancePageContent } from './_components/compliance-view';

export default function CompliancePage() {
  return (
    <Suspense fallback={<ComplianceLoading />}>
      <CompliancePageContent />
    </Suspense>
  );
}
