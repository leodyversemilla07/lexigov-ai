'use client';

import { Suspense } from 'react';
import { CompliancePageContent, ComplianceLoading } from './_components/compliance-view';

export default function CompliancePage() {
  return (
    <Suspense fallback={<ComplianceLoading />}>
      <CompliancePageContent />
    </Suspense>
  );
}
