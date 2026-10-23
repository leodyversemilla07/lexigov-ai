'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { appendDraftScope } from '@/hooks/useDraftScope';
import { api } from '@/lib/api-client';
import type { ApiDraft, PaginatedResponse } from '@/types';

const PAGE_SIZE = 100;

interface UseAllDraftsOptions {
  organizationId?: string;
  enabled?: boolean;
}

/** Load every accessible draft page in the selected workspace without silently omitting records. */
export function useAllDrafts({ organizationId, enabled = true }: UseAllDraftsOptions = {}) {
  const [data, setData] = useState<ApiDraft[] | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (!enabled) {
      setData(undefined);
      setError(null);
      setIsLoading(true);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setData(undefined);
    setIsLoading(true);
    setError(null);

    try {
      const drafts: ApiDraft[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const path = appendDraftScope(`/drafts?page=${page}&limit=${PAGE_SIZE}`, organizationId);
        const response = await api.get<PaginatedResponse<ApiDraft>>(path, { signal: controller.signal });
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
  }, [enabled, organizationId]);

  useEffect(() => {
    void load();
    return () => {
      requestRef.current += 1;
      abortRef.current?.abort();
    };
  }, [load]);

  return { data, error, isLoading, refetch: load };
}
