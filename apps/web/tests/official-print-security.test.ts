import { buildDefaultDocumentFormatConfig, type FormattedDocumentData } from '@lexigov/shared';
import { describe, expect, it } from 'vitest';
import { buildPrintDocumentHtml } from '@/lib/export/official-document-export';

describe('official print HTML security', () => {
  it('escapes all user-controlled markup and fails closed as an unverified draft', () => {
    const data: FormattedDocumentData = {
      title: '<img src=x onerror=alert(1)>',
      documentType: 'ORDINANCE',
      jurisdiction: 'city',
      jurisdictionName: '<script>alert(2)</script>',
      body: 'SECTION 1. TITLE. — <svg onload=alert(3)>',
      version: 1,
    };
    const config = buildDefaultDocumentFormatConfig('city', 'Test City');
    config.includeSessionExcerpt = true;
    config.sessionDetails = {
      sessionType: 'REGULAR', sessionDate: '2026-01-01', sessionVenue: '<iframe src=x><b>Hall</b>',
      presentMembers: ['<img onerror=alert(4)>'], absentMembers: [],
    };
    config.includeSignatures = true;
    config.signatories.secretaryName = '<script>alert(5)</script>';

    const html = buildPrintDocumentHtml(data, config);

    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<svg onload');
    expect(html).not.toContain('<iframe src');
    expect(html).toContain('&lt;img');
    expect(html).toContain("script-src 'none'");
    expect(html).toContain('WORKING DRAFT — NOT AN OFFICIAL RECORD');
    expect(html).toContain('not been authenticated or legally certified');
    expect(html).toContain('DRAFT SIGNATORY PLACEHOLDERS');
    expect(html).not.toMatch(/I HEREBY CERTIFY|DULY ADOPTED|APPROVED:/);
  });
});
