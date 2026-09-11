import { describe, expect, it } from 'vitest';
import {
  buildDefaultDocumentFormatConfig,
  extractWhereAsClausesAndBody,
  generateOfficialDocumentText,
  inferDefaultSignatories,
  inferSanggunianBodyName,
} from '../src/document-formatter';

describe('Official Philippine Government Document Formatter Suite', () => {
  describe('inferSanggunianBodyName()', () => {
    it('infers Sangguniang Panlalawigan for provincial tier', () => {
      const result = inferSanggunianBodyName('provincial', 'Rizal');
      expect(result.legislativeBody).toBe('SANGGUNIANG PANLALAWIGAN');
      expect(result.officeName).toBe('OFFICE OF THE SANGGUNIANG PANLALAWIGAN');
      expect(result.enactingClauseBody).toContain('SANGGUNIANG PANLALAWIGAN OF RIZAL');
    });

    it('infers Sangguniang Panlungsod for city tier', () => {
      const result = inferSanggunianBodyName('city', 'Pasig');
      expect(result.legislativeBody).toBe('SANGGUNIANG PANLUNGSOD');
      expect(result.officeName).toBe('OFFICE OF THE SANGGUNIANG PANLUNGSOD');
      expect(result.enactingClauseBody).toContain('SANGGUNIANG PANLUNGSOD OF PASIG');
    });

    it('infers Sangguniang Bayan for municipal tier', () => {
      const result = inferSanggunianBodyName('municipal', 'Taytay');
      expect(result.legislativeBody).toBe('SANGGUNIANG BAYAN');
      expect(result.officeName).toBe('OFFICE OF THE SANGGUNIANG BAYAN');
      expect(result.enactingClauseBody).toContain('SANGGUNIANG BAYAN OF TAYTAY');
    });

    it('infers Sangguniang Barangay for barangay tier', () => {
      const result = inferSanggunianBodyName('barangay', 'San Roque');
      expect(result.legislativeBody).toBe('SANGGUNIANG BARANGAY');
      expect(result.officeName).toBe('OFFICE OF THE SANGGUNIANG BARANGAY');
      expect(result.enactingClauseBody).toContain('SANGGUNIANG BARANGAY OF SAN ROQUE');
    });
  });

  describe('inferDefaultSignatories()', () => {
    it('provides statutory titles for city officials', () => {
      const signatories = inferDefaultSignatories('city', 'Pasig');
      expect(signatories.secretaryTitle).toBe('Secretary to the Sangguniang Panlungsod');
      expect(signatories.presidingOfficerTitle).toContain('City Vice Mayor & Presiding Officer');
      expect(signatories.chiefExecutiveTitle).toContain('City Mayor, City of Pasig');
    });
  });

  describe('buildDefaultDocumentFormatConfig()', () => {
    it('constructs a safe default configuration without invented official records', () => {
      const config = buildDefaultDocumentFormatConfig('city', 'Pasig');
      expect(config.paperSize).toBe('A4');
      expect(config.fontFamily).toBe('Book Antiqua');
      expect(config.fontSizePt).toBe(11);
      expect(config.lineSpacing).toBe(1.15);
      expect(config.includeSeals).toBe(true);
      expect(config.includeSessionExcerpt).toBe(false);
      expect(config.includeSignatures).toBe(false);
      expect(config.includeQrVerification).toBe(false);
      expect(config.sessionDetails?.presentMembers).toEqual([]);
      expect(config.signatories.secretaryName).toBe('');
    });
  });

  describe('extractWhereAsClausesAndBody()', () => {
    it('parses WHEREAS preamble, enacting clause, and numbered sections', () => {
      const rawBody = `
WHEREAS, Section 16 of RA 7160 mandates the promotion of general welfare;
WHEREAS, the City of Pasig aims to enhance citizen transparency;

BE IT ORDAINED by the Sangguniang Panlungsod of Pasig, in session assembled:

SECTION 1. SHORT TITLE. — This Ordinance shall be known as the Pasig Citizen Charter.
SECTION 2. POLICY. — It is hereby declared the policy of the city.
SECTION 3. PENALTIES. — Violators shall be fined PHP 5,000.
      `.trim();

      const parsed = extractWhereAsClausesAndBody(rawBody);
      expect(parsed.whereAsClauses.length).toBe(2);
      expect(parsed.whereAsClauses[0]).toContain('Section 16 of RA 7160');
      expect(parsed.enactingClause).toContain('BE IT ORDAINED');
      expect(parsed.sections.length).toBe(3);
      expect(parsed.sections[0]?.heading).toContain('SECTION 1');
      expect(parsed.sections[0]?.body).toContain('Pasig Citizen Charter');
    });
  });

  describe('generateOfficialDocumentText()', () => {
    it('generates an explicitly unverified working draft by default', () => {
      const config = buildDefaultDocumentFormatConfig('city', 'Pasig');
      const text = generateOfficialDocumentText(
        {
          title: 'AN ORDINANCE INSTITUTING CITIZEN CHARTER',
          enactmentNumber: '2026-042',
          documentType: 'ORDINANCE',
          jurisdiction: 'city',
          jurisdictionName: 'City of Pasig',
          body: 'WHEREAS, public service is a public trust.\n\nBE IT ORDAINED by the Sanggunian:\n\nSECTION 1. SHORT TITLE. — Citizen Charter.',
          verificationHash: 'LXG-2026-7F83B165',
          verificationUrl: 'https://lexigov.ph/verify?code=LXG-2026-7F83B165',
        },
        config,
      );

      expect(text).toContain('REPUBLIC OF THE PHILIPPINES');
      expect(text).toContain('ORDINANCE NO. 2026-042');
      expect(text).toContain('AN ORDINANCE INSTITUTING CITIZEN CHARTER');
      expect(text).toContain('WHEREAS, public service is a public trust.');
      expect(text).not.toContain('I HEREBY CERTIFY to the correctness');
      expect(text).not.toContain('LXG-2026-7F83B165');
      expect(text).toContain('WORKING DRAFT — NOT AN OFFICIAL RECORD');
      expect(text).toContain('not been authenticated or legally certified');
    });
  });
});
