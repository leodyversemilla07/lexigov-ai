import { describe, expect, it } from 'vitest';
import {
  buildComplianceAnalysisPrompt,
  buildOrdinanceDraftingPrompt,
  buildSectionAssistPrompt,
  buildSummaryPrompt,
  createAiProviderFromEnv,
  createSingleProvider,
  MockAiProvider,
  ResilientFallbackProvider,
  type AiProvider,
} from '../src';

describe('@lexigov/ai Provider Suite', () => {
  describe('MockAiProvider', () => {
    it('generates text with default statutory structure', async () => {
      const provider = new MockAiProvider();
      const result = await provider.generateText({ prompt: 'Create ordinance' });

      expect(result.text).toContain('REPUBLIC OF THE PHILIPPINES');
      expect(result.text).toContain('RA 7160');
      expect(result.provider).toBe('mock');
    });

    it('returns custom canned text when configured', async () => {
      const provider = new MockAiProvider();
      provider.setCannedResponse('Plastic Ban', 'SECTION 1. Single-use plastics are prohibited.');

      const result = await provider.generateText({ prompt: 'Plastic Ban ordinance' });
      expect(result.text).toBe('SECTION 1. Single-use plastics are prohibited.');
    });

    it('streams tokens asynchronously chunk by chunk', async () => {
      const provider = new MockAiProvider();
      provider.setCannedResponse('Streaming', 'Word1 Word2 Word3');

      const collected: string[] = [];
      for await (const chunk of provider.streamText({ prompt: 'Streaming' })) {
        collected.push(chunk);
      }

      expect(collected.join('')).toBe('Word1 Word2 Word3');
    });

    it('generates structured compliance objects', async () => {
      const provider = new MockAiProvider();
      const result = await provider.generateStructured<{ overallScore: number; isValid: boolean }>({
        prompt: 'Check compliance',
      });

      expect(result.overallScore).toBe(92);
      expect(result.isValid).toBe(true);
    });
  });

  describe('ResilientFallbackProvider', () => {
    it('uses the primary provider on success', async () => {
      const primary = new MockAiProvider();
      primary.setCannedResponse('Test', 'Primary Output');
      const secondary = new MockAiProvider();
      secondary.setCannedResponse('Test', 'Secondary Output');

      const fallback = new ResilientFallbackProvider([primary, secondary]);
      const result = await fallback.generateText({ prompt: 'Test' });

      expect(result.text).toBe('Primary Output');
    });

    it('does not concatenate fallback output after a provider emitted a partial stream', async () => {
      const partial = {
        name: 'partial',
        generateText: async () => { throw new Error('unused'); },
        generateStructured: async () => { throw new Error('unused'); },
        streamText: async function* () { yield 'partial '; throw new Error('stream interrupted'); },
      } satisfies AiProvider;
      const secondary = new MockAiProvider();
      const fallback = new ResilientFallbackProvider([partial, secondary]);
      const chunks: string[] = [];

      await expect((async () => {
        for await (const chunk of fallback.streamText({ prompt: 'Test' })) chunks.push(chunk);
      })()).rejects.toThrow('stream interrupted');
      expect(chunks).toEqual(['partial ']);
    });

    it('falls back to secondary provider on error', async () => {
      const failing: AiProvider = {
        name: 'failing',
        generateText: async () => {
          const err = new Error('Rate limit');
          (err as unknown as { status: number }).status = 429;
          throw err;
        },
        streamText: async function* () {
          throw new Error('Stream fail');
        },
        generateStructured: async () => {
          throw new Error('Structured fail');
        },
      };

      const secondary = new MockAiProvider();
      secondary.setCannedResponse('Test', 'Secondary Recovery');

      const fallback = new ResilientFallbackProvider([failing, secondary], {
        maxRetriesPerProvider: 0,
        initialBackoffMs: 10,
      });

      const result = await fallback.generateText({ prompt: 'Test' });
      expect(result.text).toBe('Secondary Recovery');
    });
  });

  describe('Factory & Prompt Builders', () => {
    it('creates single provider by name', () => {
      const provider = createSingleProvider('mock', {});
      expect(provider.name).toBe('mock');
    });

    it('creates default MockAiProvider when running in test environment', () => {
      const provider = createAiProviderFromEnv({ NODE_ENV: 'test' });
      expect(provider.name).toBe('mock');
    });

    it('builds drafting prompts with RA 7160 references', () => {
      const { systemPrompt } = buildOrdinanceDraftingPrompt({
        prompt: 'Noise pollution control',
        jurisdiction: 'city',
        jurisdictionName: 'Quezon City',
        documentType: 'ORDINANCE',
      });
      expect(systemPrompt).toContain('Quezon City');
      expect(systemPrompt).toContain('RA 7160');
    });

    it('builds section assistance prompt', () => {
      const { systemPrompt } = buildSectionAssistPrompt('Body', 'Formalize', 'city');
      expect(systemPrompt).toContain('advisory Philippine legislative drafting assistant');
      expect(systemPrompt).toContain('not an attorney');
    });

    it('builds summary prompt', () => {
      const { systemPrompt } = buildSummaryPrompt('Ordinance body');
      expect(systemPrompt).toContain('without asserting that it is valid');
    });

    it('builds compliance analysis prompt', () => {
      const { systemPrompt } = buildComplianceAnalysisPrompt('Ordinance body', 'barangay');
      expect(systemPrompt).toContain('RA 7160');
    });
  });
});
