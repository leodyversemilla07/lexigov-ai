import { MockAiProvider } from '@lexigov/ai';
import type { ComplianceIssue } from '@lexigov/shared';
import { AiService } from './ai.service';

describe('AiService with MockAiProvider', () => {
  let service: AiService;
  let mockProvider: MockAiProvider;

  beforeEach(() => {
    service = new AiService();
    mockProvider = new MockAiProvider();
    service.setProvider(mockProvider);
  });

  describe('generateOrdinance', () => {
    it('generates an ordinance draft grounded in RA 7160', async () => {
      const result = await service.generateOrdinance(
        'An ordinance establishing waste segregation and recycling policies',
        'city',
        'City of Pasig',
        'ORDINANCE',
      );

      expect(result.content).toContain('REPUBLIC OF THE PHILIPPINES');
      expect(result.content).toContain('PASIG');
      expect(result.model).toBeDefined();
      expect(result.generatedAt).toBeGreaterThan(0);
    });

    it('uses custom canned responses when provided to mock provider', async () => {
      mockProvider.setCannedResponse('Custom Curfew', 'SECTION 1. Curfew hours are 10pm to 4am.');

      const result = await service.generateOrdinance(
        'Custom Curfew draft',
        'barangay',
        'Barangay San Roque',
        'ORDINANCE',
      );

      expect(result.content).toBe('SECTION 1. Curfew hours are 10pm to 4am.');
    });
  });

  describe('generateOrdinanceStream', () => {
    it('streams generated tokens chunk by chunk', async () => {
      mockProvider.setCannedResponse('Stream test', 'SECTION 1. Traffic regulation.');

      const chunks: string[] = [];
      for await (const chunk of service.generateOrdinanceStream('Stream test', 'city', 'Quezon City', 'ORDINANCE')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Traffic regulation');
    });
  });

  describe('checkCompliance', () => {
    it('returns empty result for unknown jurisdictions without throwing', async () => {
      const result = await service.checkCompliance('Some content', 'unknown_jurisdiction');
      expect(result.isValid).toBe(false);
      expect(result.issues).toEqual([]);
    });

    it('merges AI-returned issues with deterministic compliance analysis', async () => {
      const aiIssues: ComplianceIssue[] = [
        {
          type: 'suggestion',
          section: 'SECTION 4. Penalties',
          title: 'Add alternative community service',
          description: 'Specify community service alternatives for indigent offenders.',
          suggestion: 'Provide 8 hours community service option pursuant to DILG guidelines.',
        },
      ];

      mockProvider.setStructuredResponse('compliance review', { issues: aiIssues });

      const result = await service.checkCompliance('Short draft with no penalties or standard clauses.', 'city');

      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('generateSummary', () => {
    it('generates an executive summary of an ordinance', async () => {
      mockProvider.setCannedResponse('Summary prompt', 'This ordinance regulates municipal waste management.');

      const result = await service.generateSummary('Summary prompt content of the ordinance');
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
    });
  });

  describe('assistSection', () => {
    it('assists with section formalization and returns revised text', async () => {
      mockProvider.setCannedResponse(
        'Penalties task',
        'SECTION 4. Penalties. Any person violating this Ordinance shall be fined ₱5,000.00.',
      );

      const result = await service.assistSection(
        'SECTION 4. Penalties',
        'Fines will be collected.',
        'penalties',
        'Set maximum city penalty',
        'city',
        'ORDINANCE',
      );

      expect(result.action).toBe('penalties');
      expect(result.sectionBody).toBeDefined();
    });
  });
});
