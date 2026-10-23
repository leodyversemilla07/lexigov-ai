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
} from '@lexigov/ai';
import {
  validateClientEnv,
  validateServerEnv,
} from '@lexigov/env';

describe('@lexigov/env validation', () => {
  it('validates a complete server environment configuration', () => {
    const env = validateServerEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/lexigov',
      BETTER_AUTH_SECRET: 'test-secret-at-least-32-chars-long',
      AI_PROVIDER: 'azure',
      AZURE_OPENAI_API_KEY: 'test-key',
      AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
      AZURE_OPENAI_DEPLOYMENT: 'gpt-4o',
    });

    expect(env.AI_PROVIDER).toBe('azure');
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('throws a descriptive error when required server variables are missing', () => {
    expect(() => validateServerEnv({})).toThrow(/LexiGov Env Validation Failed/);
  });

  it('validates client environment defaults', () => {
    const clientEnv = validateClientEnv({});
    expect(clientEnv.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000');
    expect(clientEnv.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });
});

describe('@lexigov/ai Provider Abstractions & Mock Driver', () => {
  it('generates text via MockAiProvider with default legislative response', async () => {
    const provider = new MockAiProvider();
    const result = await provider.generateText({
      prompt: 'Draft an ordinance for waste management in Pasig',
    });

    expect(result.text).toContain('REPUBLIC OF THE PHILIPPINES');
    expect(result.text).toContain('PASIG');
    expect(result.provider).toBe('mock');
    expect(result.usage?.promptTokens).toBeGreaterThan(0);
  });

  it('handles custom canned responses in MockAiProvider', async () => {
    const provider = new MockAiProvider();
    provider.setCannedResponse('Curfew', 'SECTION 1. Curfew is from 10:00 PM to 4:00 AM.');

    const result = await provider.generateText({
      prompt: 'Curfew ordinance for minors',
    });

    expect(result.text).toBe('SECTION 1. Curfew is from 10:00 PM to 4:00 AM.');
  });

  it('streams tokens asynchronously via AsyncIterable', async () => {
    const provider = new MockAiProvider();
    provider.setCannedResponse('Stream target', 'Token1 Token2 Token3');

    const collected: string[] = [];
    const stream = provider.streamText({
      prompt: 'Stream target',
      onToken: (t) => collected.push(t),
    });

    const yielded: string[] = [];
    for await (const chunk of stream) {
      yielded.push(chunk);
    }

    expect(yielded.join('')).toBe('Token1 Token2 Token3');
    expect(collected.length).toBeGreaterThan(0);
  });

  it('generates structured compliance JSON via MockAiProvider', async () => {
    const provider = new MockAiProvider();
    const structured = await provider.generateStructured<{ overallScore: number; isValid: boolean }>({
      prompt: 'Check compliance for ordinance draft',
    });

    expect(structured.overallScore).toBe(92);
    expect(structured.isValid).toBe(true);
  });
});

describe('@lexigov/ai ResilientFallbackProvider & Failover', () => {
  it('uses the primary provider when healthy', async () => {
    const primary = new MockAiProvider();
    primary.setCannedResponse('Hello', 'Primary Success');
    const secondary = new MockAiProvider();
    secondary.setCannedResponse('Hello', 'Secondary Success');

    const fallback = new ResilientFallbackProvider([primary, secondary]);
    const result = await fallback.generateText({ prompt: 'Hello' });

    expect(result.text).toBe('Primary Success');
  });

  it('automatically falls back to secondary provider when primary throws an error', async () => {
    const failingPrimary: AiProvider = {
      name: 'failing-primary',
      generateText: async () => {
        const err = new Error('Rate limit exceeded');
        (err as unknown as { status: number }).status = 429;
        throw err;
      },
      streamText: async function* () {
        throw new Error('Stream failed');
      },
      generateStructured: async () => {
        throw new Error('Structured failed');
      },
    };

    const healthySecondary = new MockAiProvider();
    healthySecondary.setCannedResponse('Hello', 'Recovered on Secondary');

    const fallback = new ResilientFallbackProvider([failingPrimary, healthySecondary], {
      maxRetriesPerProvider: 0,
      initialBackoffMs: 10,
    });

    const result = await fallback.generateText({ prompt: 'Hello' });
    expect(result.text).toBe('Recovered on Secondary');
  });
});

describe('@lexigov/ai Factory & Environment Loader', () => {
  it('instantiates single providers via createSingleProvider', () => {
    const mock = createSingleProvider('mock', {});
    expect(mock.name).toBe('mock');

    const openAiComp = createSingleProvider('openai-compatible', {
      baseUrl: 'http://localhost:11434/v1',
      model: 'llama3',
    });
    expect(openAiComp.name).toBe('openai-compatible');
  });

  it('instantiates MockAiProvider when running in test/dev without cloud keys', () => {
    const provider = createAiProviderFromEnv({
      NODE_ENV: 'test',
      AI_PROVIDER: 'azure',
    });

    expect(provider).toBeDefined();
    expect(provider.name).toBe('mock');
  });
});

describe('@lexigov/ai Legislative Prompt Builders', () => {
  it('builds an ordinance drafting prompt with RA 7160 statutory grounding', () => {
    const { systemPrompt, userPrompt } = buildOrdinanceDraftingPrompt({
      prompt: 'Regulate single-use plastics and waste segregation',
      jurisdiction: 'city',
      jurisdictionName: 'Quezon City',
      documentType: 'ORDINANCE',
    });

    expect(systemPrompt).toContain('Philippine legislative drafting');
    expect(systemPrompt).toContain('Quezon City');
    expect(systemPrompt).toContain('RA 7160');
    expect(systemPrompt).toContain('RA 9003'); // Solid waste citation
    expect(userPrompt).toContain('single-use plastics');
  });

  it('builds a section assistance prompt with formalization directives', () => {
    const { systemPrompt, userPrompt } = buildSectionAssistPrompt(
      'Fines will be paid by violators.',
      'Set municipal penalty limit',
      'municipal',
    );

    expect(systemPrompt).toContain('advisory Philippine legislative drafting assistant');
    expect(systemPrompt).toContain('not an attorney');
    expect(userPrompt).toContain('Fines will be paid by violators');
    expect(userPrompt).toContain('municipal penalty limit');
  });

  it('builds an executive summary prompt', () => {
    const { systemPrompt, userPrompt } = buildSummaryPrompt('Ordinance body text...');
    expect(systemPrompt).toContain('without asserting that it is valid');
    expect(userPrompt).toBe('Ordinance body text...');
  });

  it('builds a structured compliance analysis prompt', () => {
    const { systemPrompt, userPrompt } = buildComplianceAnalysisPrompt('Draft content', 'barangay');
    expect(systemPrompt).toContain('RA 7160');
    expect(systemPrompt).toContain('barangay');
    expect(systemPrompt).toContain('"type": "critical"');
    expect(systemPrompt).toContain('"description"');
    expect(userPrompt).toBe('Draft content');
  });
});
