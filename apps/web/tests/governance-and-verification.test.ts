import { describe, expect, it } from 'vitest';
import {
  buildVerificationMetadata,
  calculateTransmittalDeadline,
  generateSuggestedWhereasClauses,
  generateVerificationHash,
  getStatutoryCitations,
} from '@lexigov/shared';

describe('Statutory Citations & Legal Grounding', () => {
  it('includes General Welfare Clause (RA 7160 Sec 16) for any ordinance', () => {
    const citations = getStatutoryCitations('Traffic management and parking', 'city');
    expect(citations.some((c) => c.provision.includes('Section 16'))).toBe(true);
  });

  it('matches Tax & Public Hearing provisions for tax and fee measures', () => {
    const citations = getStatutoryCitations('An ordinance revising local business tax and regulatory fees', 'municipal');
    expect(citations.some((c) => c.provision.includes('Section 187'))).toBe(true);
    expect(citations.some((c) => c.provision.includes('Article X, Section 5'))).toBe(true);
  });

  it('matches Solid Waste Management Act (RA 9003) for garbage and sanitation measures', () => {
    const citations = getStatutoryCitations('Regulating single-use plastics and waste segregation', 'barangay');
    expect(citations.some((c) => c.provision.includes('RA 9003'))).toBe(true);
  });

  it('generates suggested WHEREAS clauses containing Philippine legal citations', () => {
    const whereasList = generateSuggestedWhereasClauses('Curfew for minors during school hours', 'City of Pasig', 'city');
    expect(whereasList.length).toBeGreaterThanOrEqual(2);
    expect(whereasList.some((w) => w.includes('Republic Act No. 7160'))).toBe(true);
  });
});

describe('Sanggunian Legislative Tracker & Transmittal Deadlines', () => {
  it('computes 10-day statutory transmittal deadline for city and municipal ordinances', () => {
    const deadline = calculateTransmittalDeadline('2025-06-01', 'city');
    expect(deadline).toBe('2025-06-11');
  });

  it('computes 15-day statutory transmittal deadline for provincial ordinances', () => {
    const deadline = calculateTransmittalDeadline('2025-06-01', 'provincial');
    expect(deadline).toBe('2025-06-16');
  });
});

describe('Digital Authenticity & Document Verification Engine', () => {
  it('generates a deterministic verification hash', () => {
    const hash1 = generateVerificationHash('draft_123', 'Waste Segregation', 'city', 1, 'Sample content');
    const hash2 = generateVerificationHash('draft_123', 'Waste Segregation', 'city', 1, 'Sample content');
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('LXG-')).toBe(true);
  });

  it('builds full verification metadata with public URL', () => {
    const meta = buildVerificationMetadata(
      {
        id: 'draft_999',
        title: 'Anti-Noise Ordinance',
        jurisdictionName: 'Quezon City',
        jurisdiction: 'city',
        documentType: 'ORDINANCE',
        version: 2,
        status: 'FINAL',
      },
      'Body text',
    );

    expect(meta.documentId).toBe('draft_999');
    expect(meta.verificationHash.startsWith('LXG-')).toBe(true);
    expect(meta.verificationUrl).toContain('code=LXG-');
    expect(meta.verificationUrl).toContain('id=draft_999');
  });
});
