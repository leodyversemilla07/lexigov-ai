'use client';

import { AuthProvider } from '@lexigov/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
