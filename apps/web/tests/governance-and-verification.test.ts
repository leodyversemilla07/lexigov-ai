import { describe, expect, it } from 'vitest';
import {
  buildVerificationMetadata,
  calculateTransmittalDeadline,
  extractDraftMilestones,
  generateSuggestedWhereasClauses,
  generateVerificationHash,
  getStatutoryCitations,
  updateDraftMilestonesContent,
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

  it('uses the SPARK decision rather than an unrelated DILG circular for curfew review', () => {
    const citations = getStatutoryCitations('Curfew for minors during school hours', 'city');
    expect(citations.some((citation) => citation.provision.includes('G.R. No. 225442'))).toBe(true);
    expect(citations.every((citation) => !citation.provision.includes('2019-145'))).toBe(true);

    const whereasList = generateSuggestedWhereasClauses('Curfew for minors during school hours', 'City of Pasig', 'city');
    expect(whereasList.some((clause) => clause.includes('Republic Act No. 7160'))).toBe(true);
    expect(whereasList.every((clause) => !clause.includes('duly conducted'))).toBe(true);
  });

  it('matches Katarungang Pambarangay provisions for barangay dispute settlement', () => {
    const citations = getStatutoryCitations('Establishing guidelines for Lupon Tagapamayapa mediation and dispute resolution', 'barangay');
    expect(citations.some((c) => c.provision.includes('Sections 399–422'))).toBe(true);
  });

  it('attributes the LDRRM fund requirement to RA 10121 Section 21', () => {
    const citations = getStatutoryCitations('Allocating LDRRM emergency disaster fund for flood evacuation centers', 'city');
    expect(citations.some((citation) => citation.provision.includes('Sections 12 and 21'))).toBe(true);
  });

  it('attributes BOSS/e-BOSS requirements to RA 11032 Section 11 and respects jurisdiction', () => {
    const municipal = getStatutoryCitations(
      'Streamlining business permit processing and establishing an electronic one-stop shop',
      'municipal',
    );
    const barangay = getStatutoryCitations(
      'Streamlining business permit processing and establishing an electronic one-stop shop',
      'barangay',
    );
    expect(municipal.some((citation) => citation.provision.includes('11'))).toBe(true);
    expect(barangay.every((citation) => !citation.provision.includes('RA 11032'))).toBe(true);
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

  it('extracts and updates milestones in structured draft content', () => {
    const initialContent = { body: 'SECTION 1. Title.' };
    const updated = updateDraftMilestonesContent(initialContent, {
      currentStage: 'FIRST_READING',
      firstReadingDate: '2026-08-29',
      referredCommittee: 'Committee on Laws and Rules',
    });

    expect(updated.milestones?.currentStage).toBe('FIRST_READING');
    expect(updated.milestones?.referredCommittee).toBe('Committee on Laws and Rules');

    const extracted = extractDraftMilestones(updated);
    expect(extracted?.firstReadingDate).toBe('2026-08-29');
  });
});

describe('Unverified Document Content Fingerprints', () => {
  it('generates a deterministic SHA-256 fingerprint that covers content', async () => {
    const hash1 = await generateVerificationHash('draft_123', 'Waste Segregation', 'city', 1, 'Sample content');
    const hash2 = await generateVerificationHash('draft_123', 'Waste Segregation', 'city', 1, 'Sample content');
    const changed = await generateVerificationHash('draft_123', 'Waste Segregation', 'city', 1, 'Tampered text!');
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(changed).not.toBe(hash1);
  });

  it('builds metadata that explicitly fails closed as unverified', async () => {
    const meta = await buildVerificationMetadata(
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
    expect(meta.status).toBe('UNVERIFIED');
    expect(meta.verificationHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(meta.verificationUrl).toBe('/verify');
  });
});
