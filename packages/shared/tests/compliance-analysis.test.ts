import { describe, expect, it } from 'vitest';
import { analyzeDeterministicCompliance, buildComplianceResultFromIssues } from '../src/compliance-analysis';

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
    const promptShaped = [{
      type: 'violation', section: 'Penalty', message: 'Exceeds ceiling', recommendation: 'Reduce it',
    }];
    const result = buildComplianceResultFromIssues(promptShaped as never);
    expect(result.isValid).toBe(false);
    expect(result.overallScore).toBeLessThan(100);
  });
});
