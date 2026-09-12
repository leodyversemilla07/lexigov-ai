'use client';

import { authClient } from '@/lib/auth-client';

/** The active Better Auth organization determines whether draft screens use a personal or LGU workspace. */
export function useDraftScope() {
  const { data: organization, isPending, error, refetch } = authClient.useActiveOrganization();
  return {
    organization: organization ?? null,
    organizationId: organization?.id,
    isLoading: isPending,
    error: error ? new Error(error.message || 'Failed to load the active organization') : null,
    refetch,
  };
}

export function appendDraftScope(path: string, organizationId?: string): string {
  if (!organizationId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}organizationId=${encodeURIComponent(organizationId)}`;
}
