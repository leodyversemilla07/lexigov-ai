'use client';

import { Suspense } from 'react';
import { AIPageContent, AIPageLoading } from './_components/ai-generator';

export default function AIPage() {
  return (
    <Suspense fallback={<AIPageLoading />}>
      <AIPageContent />
    </Suspense>
  );
}
