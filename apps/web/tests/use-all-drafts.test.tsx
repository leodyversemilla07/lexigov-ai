import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiDraft, PaginatedResponse } from '@/types';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock('@/lib/api-client', () => ({ api: { get: getMock } }));

function page(data: ApiDraft[], pageNumber: number, totalPages: number): PaginatedResponse<ApiDraft> {
  return { data, page: pageNumber, limit: 100, total: totalPages * 100, totalPages };
}

const draft = (id: string): ApiDraft => ({
  id,
  title: id,
  documentType: 'ORDINANCE',
  jurisdiction: 'city',
  jurisdictionName: 'Test City',
  status: 'DRAFT',
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('useAllDrafts', () => {
  beforeEach(() => getMock.mockReset());

  it('loads every API page instead of silently truncating selectors', async () => {
    getMock
      .mockResolvedValueOnce(page([draft('d1')], 1, 3))
      .mockResolvedValueOnce(page([draft('d2')], 2, 3))
      .mockResolvedValueOnce(page([draft('d3')], 3, 3));
    const { useAllDrafts } = await import('@/hooks/useAllDrafts');
    const { result } = renderHook(() => useAllDrafts());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.map((item) => item.id)).toEqual(['d1', 'd2', 'd3']);
    expect(getMock.mock.calls.map(([path]) => path)).toEqual([
      '/drafts?page=1&limit=100', '/drafts?page=2&limit=100', '/drafts?page=3&limit=100',
    ]);
  });

  it('fails the complete load rather than presenting a partial list', async () => {
    getMock.mockResolvedValueOnce(page([draft('d1')], 1, 2)).mockRejectedValueOnce(new Error('page failed'));
    const { useAllDrafts } = await import('@/hooks/useAllDrafts');
    const { result } = renderHook(() => useAllDrafts());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error?.message).toBe('page failed');
  });
});
