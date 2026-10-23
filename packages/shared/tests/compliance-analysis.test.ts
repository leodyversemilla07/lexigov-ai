import { describe, expect, it } from 'vitest';
import {
  buildComplianceResultFromIssues,
  complianceAnalysisJsonSchema,
  mergeComplianceIssues,
  parseComplianceResult,
  toComplianceIssue,
} from '../src';
import { analyzeDeterministicCompliance } from '../src/compliance-analysis';

describe('compliance analysis contracts', () => {
  it('detects parenthesized and word-form imprisonment above the city ceiling', () => {
    const result = analyzeDeterministicCompliance(
      'Republic of the Philippines. WHEREAS public welfare requires action. SECTION 1. PENALTY. Imprisonment of two (2) years shall be imposed. SECTION 2. Separability. SECTION 3. Repealing. SECTION 4. This shall take effect after publication and posting.',
      'city',
    );
    expect(result.issues.some((issue) => issue.title.includes('Imprisonment term exceeds'))).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it('does not silently treat prompt-shaped issue objects as valid compliance issues', () => {
    const promptShaped = [
      {
        type: 'violation',
        section: 'Penalty',
        message: 'Exceeds ceiling',
        recommendation: 'Reduce it',
      },
    ];
    const result = buildComplianceResultFromIssues(promptShaped as never);
    expect(result.isValid).toBe(false);
    expect(result.overallScore).toBeLessThan(100);
  });
});

describe('@lexigov/shared Compliance Analysis (AI contract)', () => {
  describe('complianceAnalysisJsonSchema', () => {
    it('defines the canonical AI compliance payload shape', () => {
      expect(complianceAnalysisJsonSchema.type).toBe('object');
      // Issues only: the score and validity flag are computed by the application.
      expect(complianceAnalysisJsonSchema.required).toEqual(['issues']);

      const issuesSchema = (complianceAnalysisJsonSchema.properties as Record<string, unknown>).issues as {
        type: string;
        items?: { required?: string[]; properties?: Record<string, unknown> };
      };
      expect(issuesSchema.type).toBe('array');
      expect(issuesSchema.items?.required).toContain('type');
      expect(issuesSchema.items?.required).toContain('title');
      expect(issuesSchema.items?.required).toContain('description');
      expect(issuesSchema.items?.required).toContain('suggestion');
    });
  });

  describe('toComplianceIssue', () => {
    it('normalizes a canonical compliance issue', () => {
      const issue = toComplianceIssue({
        type: 'critical',
        section: 'SECTION 4. Penalties.',
        title: 'Fine exceeds jurisdiction limit',
        description: 'Fine of P5,000 exceeds barangay ceiling.',
        suggestion: 'Reduce fine to P1,000.',
      });

      expect(issue).toEqual({
        type: 'critical',
        section: 'SECTION 4. Penalties.',
        title: 'Fine exceeds jurisdiction limit',
        description: 'Fine of P5,000 exceeds barangay ceiling.',
        suggestion: 'Reduce fine to P1,000.',
      });
    });

    it('maps legacy provider field names onto the canonical shape', () => {
      const issue = toComplianceIssue({
        type: 'violation',
        section: 'SECTION 4. Penalties.',
        message: 'Fine exceeds jurisdiction limit',
        legalBasis: 'RA 7160 Section 391(a)(14)',
        recommendation: 'Reduce the fine.',
      });

      expect(issue).not.toBeNull();
      expect(issue?.type).toBe('critical');
      expect(issue?.title).toBe('Fine exceeds jurisdiction limit');
      expect(issue?.description).toBe('Fine exceeds jurisdiction limit');
      expect(issue?.suggestion).toBe('Reduce the fine.');
    });
  });

  describe('parseComplianceResult', () => {
    it('parses and normalizes a full AI compliance payload', () => {
      const result = parseComplianceResult({
        overallScore: 42,
        isValid: false,
        issues: [
          {
            type: 'warning',
            section: 'Preamble',
            title: 'Missing WHEREAS clauses',
            description: 'No legal basis recital found.',
            suggestion: 'Add WHEREAS clauses.',
          },
        ],
      });

      expect(result).not.toBeNull();
      expect(result?.overallScore).toBe(42);
      expect(result?.isValid).toBe(false);
      expect(result?.issues).toHaveLength(1);
      expect(result?.issues[0]?.type).toBe('warning');
    });

    it('derives the score when the provider returns issues only', () => {
      const result = parseComplianceResult({
        issues: [
          {
            type: 'critical',
            section: 'Penal Provisions',
            title: 'Fine exceeds ceiling',
            description: 'Above the barangay limit.',
            suggestion: 'Reduce the fine.',
          },
        ],
      });

      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(false);
      expect(result?.overallScore).toBe(75); // 100 - 25 for one critical issue
    });

    it('returns null when there is nothing usable to normalize', () => {
      expect(parseComplianceResult({ isValid: true })).toBeNull();
      expect(parseComplianceResult(null)).toBeNull();
    });
  });

  describe('mergeComplianceIssues with normalized AI issues', () => {
    it('merges deterministic and normalized AI issues without duplicates', () => {
      const merged = mergeComplianceIssues(
        [
          {
            type: 'critical' as const,
            section: 'Final Provisions',
            title: 'Missing effectivity clause',
            description: 'Draft has no effectivity clause.',
            suggestion: 'Add effectivity clause.',
          },
        ],
        [
          {
            type: 'critical',
            section: 'Final Provisions',
            title: 'Missing effectivity clause',
            description: 'Draft has no effectivity clause.',
            suggestion: 'Add effectivity clause.',
          },
          {
            type: 'suggestion',
            section: 'Penal Provisions',
            title: 'Consider community service alternatives',
            description: 'Consider alternatives.',
            suggestion: 'Specify community service.',
          },
        ],
      );

      expect(merged).toHaveLength(2);
    });

    it('builds a compliance result from fully-specified issues', () => {
      const result = buildComplianceResultFromIssues([
        { type: 'critical', title: 'A', description: 'Detail A', suggestion: 'Fix A' },
        { type: 'critical', title: 'B', description: 'Detail B', suggestion: 'Fix B' },
        { type: 'warning', title: 'C', description: 'Detail C', suggestion: 'Fix C' },
      ]);

      expect(result.overallScore).toBe(40); // 100 - (25 + 25 + 10)
      expect(result.isValid).toBe(false);
    });
  });
});
