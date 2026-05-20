'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type ApiError, api } from './api-client';

type QueryStatus = 'loading' | 'success' | 'error';

export function useApiQuery<T>(path: string | null) {
  const [data, setData] = useState<T | null | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<QueryStatus>('loading');
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();

    if (path === null) {
      setData(undefined);
      setError(null);
      setStatus('loading');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    api
      .get<T>(path)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setStatus('success');
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          if (err instanceof ApiError && err.status === 404) {
            setData(null);
            setStatus('success');
          } else {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            setStatus('error');
            setData(undefined);
          }
        }
      });
  }, [path]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  return { data, error, status, isLoading: status === 'loading', refetch: fetchData };
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
    [pathTemplate],
  );

  return [mutate, { isLoading, error }] as const;
}
