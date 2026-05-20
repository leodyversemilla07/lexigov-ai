'use client';

import { useEffect, useRef } from 'react';
import { getSession } from '@/lib/auth-client';

export function UserBootstrap() {
  const lastSessionUserId = useRef<string | null>(null);

  useEffect(() => {
    void getSession().then(({ data: session }) => {
      if (session && session.user.id !== lastSessionUserId.current) {
        lastSessionUserId.current = session.user.id;
      }
    });
  }, []);

  return null;
}
