'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from './api-client';

type QueryStatus = 'loading' | 'success' | 'error';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  cache.delete(key);
  return undefined;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const promise = fetcher().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export interface UseApiQueryOptions {
  /** How long (ms) cached data is considered fresh. Default 30_000. */
  staleTime?: number;
  /** Disable caching entirely for this query. Default false. */
  noCache?: boolean;
}

export function useApiQuery<T>(path: string | null, options?: UseApiQueryOptions) {
  const staleTime = options?.staleTime ?? 30_000;
  const noCache = options?.noCache ?? false;

  const [data, setData] = useState<T | null | undefined>(() => {
    if (!noCache && path !== null) {
      return getCached<T>(path);
    }
    return undefined;
  });
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<QueryStatus>(data !== undefined ? 'success' : 'loading');
  const abortRef = useRef<AbortController | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const fetchData = useCallback(async (): Promise<T | null | undefined> => {
    if (abortRef.current) abortRef.current.abort();

    if (pathRef.current === null) {
      setData(undefined);
      setError(null);
      setStatus('loading');
      return undefined;
    }

    const cacheKey = pathRef.current;

    if (!noCache) {
      const cached = getCached<T>(cacheKey);
      if (cached !== undefined) {
        setData(cached);
        setStatus('success');
        return cached;
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const result = await deduplicate(cacheKey, async () => {
        const res = await api.get<T>(cacheKey, { signal: controller.signal });
        return res;
      });

      if (!controller.signal.aborted) {
        if (!noCache) setCache(cacheKey, result, staleTime);
        setData(result);
        setStatus('success');
        return result;
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return undefined;

      if (err instanceof ApiError && err.status === 404) {
        setData(null);
        setStatus('success');
        return null;
      }

      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setStatus('error');
      setData(undefined);
    }
    return undefined;
  }, [staleTime, noCache]);

  useEffect(() => {
    void fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  /** Force-refetch regardless of cache. */
  const refetch = useCallback(async (): Promise<T | null | undefined> => {
    const cacheKey = pathRef.current;
    if (cacheKey) cache.delete(cacheKey);
    return fetchData();
  }, [fetchData]);

  /** Update local state immediately and optionally sync to cache. */
  const setQueryData = useCallback(
    (updater: T | ((prev: T | null | undefined) => T)): void => {
      setData((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: T | null | undefined) => T)(prev) : updater;
        const cacheKey = pathRef.current;
        if (!noCache && cacheKey) setCache(cacheKey, next, staleTime);
        return next;
      });
    },
    [staleTime, noCache],
  );

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    refetch,
    setQueryData,
  };
}

export function useApiMutation<TResponse, TBody = void>(method: 'POST' | 'DELETE', pathTemplate: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (body?: TBody): Promise<TResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const result =
          method === 'DELETE'
            ? await api.delete<TResponse>(pathTemplate)
            : await api.post<TResponse>(pathTemplate, body ?? {});
        return result;
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [method, pathTemplate],
  );

  return [mutate, { isLoading, error }] as const;
}
