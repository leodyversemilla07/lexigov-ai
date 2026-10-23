import { describe, expect, it } from 'vitest';
import { buildTextExportContent } from '@/app/(protected)/export/_components/export-manager';
import type { ApiDraft, ApiDraftVersion } from '@/types';

const draft: ApiDraft = {
  id: 'draft-1', title: 'Sample Ordinance', documentType: 'ORDINANCE', jurisdiction: 'city',
  jurisdictionName: 'Test City', status: 'DRAFT', version: 1, updatedAt: '2026-01-01T00:00:00.000Z',
};
const body = [
  'REPUBLIC OF THE PHILIPPINES',
  'CITY OF TEST',
  '',
  'WHEREAS, public welfare requires action under Section 16 of RA 7160;',
  '',
  'SECTION 1. TITLE.',
  'This is the operative body.',
].join('\n');
const version: ApiDraftVersion = {
  id: 'draft-1', title: draft.title, status: 'DRAFT', version: 1, updatedAt: draft.updatedAt,
  createdAt: draft.updatedAt, isCurrent: true, body,
};

describe('lossless text exports', () => {
  it.each(['txt', 'md'] as const)('preserves the complete source body in %s exports', (format) => {
    const exported = buildTextExportContent(draft, version, format);
    expect(exported).toContain(body);
    expect(exported).toContain('WORKING DRAFT — NOT AN OFFICIAL RECORD');
  });
});
