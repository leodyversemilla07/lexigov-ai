'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import type { ApiDraft, PaginatedResponse } from '@/types';

const PAGE_SIZE = 100;

/** Load every owner-scoped draft page for selectors that must not silently omit records. */
export function useAllDrafts() {
  const [data, setData] = useState<ApiDraft[] | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const drafts: ApiDraft[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const response = await api.get<PaginatedResponse<ApiDraft>>(`/drafts?page=${page}&limit=${PAGE_SIZE}`, {
          signal: controller.signal,
        });
        drafts.push(...response.data);
        totalPages = response.totalPages;
        page += 1;
      } while (page <= totalPages);

      if (requestRef.current === requestId) setData(drafts);
    } catch (cause) {
      if (controller.signal.aborted || requestRef.current !== requestId) return;
      setData(undefined);
      setError(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      if (requestRef.current === requestId) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestRef.current += 1;
      abortRef.current?.abort();
    };
  }, [load]);

  return { data, error, isLoading, refetch: load };
}
