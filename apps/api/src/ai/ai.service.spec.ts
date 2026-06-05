import type { ComplianceIssue } from '@lexigov/shared';

/**
 * Tests for the AI service.
 *
 * The service dynamically imports `openai` and instantiates `AzureOpenAI`.
 * We use `jest.isolateModules` + `jest.doMock('openai', ...)` to swap in a
 * fake module per test, then verify the call shape (model, messages,
 * max_completion_tokens) without hitting Azure.
 *
 * Note: `jest.isolateModules` is synchronous; we kick off the service call
 * inside it, capture the promise, and await it outside the callback.
 */

const ORIGINAL_ENV = { ...process.env };

function setAzureEnv() {
  process.env.AZURE_OPENAI_API_KEY = 'test-key';
  process.env.AZURE_OPENAI_ENDPOINT = 'https://example.openai.azure.com';
  process.env.AZURE_OPENAI_API_VERSION = '2024-10-21';
  process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o';
}

function clearAzureEnv() {
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_API_VERSION;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
}

interface ChatCompletionResponse {
  choices: Array<{ message?: { content?: string | null } }>;
}

/**
 * Run a callback with a mocked `openai` module. The callback receives the
 * mock factory and the captured create mock so it can assert call shape.
 * Returns the callback's return value (which may be a promise).
 */
function withMockedOpenAi<T>(
  responseFactory: () => ChatCompletionResponse | Promise<ChatCompletionResponse> | Error,
  body: (create: jest.Mock) => T,
): T {
  const create = jest.fn(async (_args: unknown) => {
    const r = responseFactory();
    if (r instanceof Error) throw r;
    return r;
  });

  let result!: T;
  jest.isolateModules(() => {
    jest.doMock('openai', () => ({
      AzureOpenAI: jest.fn().mockImplementation(() => ({
        chat: { completions: { create } },
      })),
    }));
    // The body callback re-requires the service inside the isolated module
    // registry so the dynamic import('openai') resolves to our mock.
    result = body(create);
  });
  return result;
}

beforeEach(() => {
  clearAzureEnv();
});

afterEach(() => {
  jest.resetModules();
  jest.dontMock('openai');
  process.env = { ...ORIGINAL_ENV };
});

describe('AiService.generateOrdinance', () => {
  it('throws a descriptive error when Azure OpenAI env vars are missing', () => {
    let caught: unknown;
    jest.isolateModules(() => {
      jest.doMock('openai', () => ({
        AzureOpenAI: jest.fn(),
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AiService } = require('./ai.service') as typeof import('./ai.service');
      const service = new AiService();
      service.generateOrdinance('test prompt', 'barangay', 'Brgy San Roque', 'ORDINANCE').catch((err: unknown) => {
        caught = err;
      });
    });
    return new Promise<void>((resolve) => {
      setImmediate(() => {
        expect(caught).toBeInstanceOf(Error);
        expect((caught as Error).message).toBe('Azure OpenAI not configured');
        resolve();
      });
    });
  });

  it('calls Azure OpenAI with the configured deployment and returns the message content', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: 'SECTION 1. Curfew hours are 10pm to 4am.' } }] }),
      (create) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service
          .generateOrdinance('Write a curfew ordinance', 'barangay', 'Barangay San Roque', 'ORDINANCE')
          .then((result) => {
            expect(result.content).toBe('SECTION 1. Curfew hours are 10pm to 4am.');
            expect(result.model).toBe('gpt-4o');
            expect(result.generatedAt).toBeGreaterThan(0);
            expect(create).toHaveBeenCalledTimes(1);
            const callArgs = create.mock.calls[0]?.[0] as {
              model: string;
              max_completion_tokens: number;
              messages: Array<{ role: string; content: string }>;
            };
            expect(callArgs.model).toBe('gpt-4o');
            expect(callArgs.max_completion_tokens).toBe(8192);
            expect(callArgs.messages[0]?.role).toBe('system');
            expect(callArgs.messages[0]?.content).toContain('Philippine legislative drafting');
            expect(callArgs.messages[0]?.content).toContain('barangay');
            expect(callArgs.messages[0]?.content).toContain('Barangay San Roque');
            // documentType is lowercased in the system prompt
            expect(callArgs.messages[0]?.content).toContain('ordinance');
            expect(callArgs.messages[1]).toEqual({ role: 'user', content: 'Write a curfew ordinance' });
          });
      },
    );
    await promise;
  });

  it('returns an empty string when the Azure response has no content', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: null } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.generateOrdinance('test', 'barangay', 'Brgy', 'ORDINANCE').then((r: { content: string }) => {
          expect(r.content).toBe('');
        });
      },
    );
    await promise;
  });

  it('lowercases the document type in the system prompt (RESOLUTION → resolution)', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: 'WHEREAS, ...' } }] }),
      (create) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.generateOrdinance('test', 'barangay', 'Brgy', 'RESOLUTION').then(() => {
          const callArgs = create.mock.calls[0]?.[0] as {
            messages: Array<{ role: string; content: string }>;
          };
          // The system prompt should reference the lowercased document type
          // so the model knows what kind of document to draft.
          expect(callArgs.messages[0]?.content).toContain('resolution');
          expect(callArgs.messages[0]?.content).not.toContain('RESOLUTION');
        });
      },
    );
    await promise;
  });

  it('anchors the system prompt to RA 7160 format and the Philippine legal context', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: 'DRAFT' } }] }),
      (create) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.generateOrdinance('test', 'city', 'City of Example', 'ORDINANCE').then(() => {
          const callArgs = create.mock.calls[0]?.[0] as {
            messages: Array<{ role: string; content: string }>;
          };
          // The system prompt should anchor the model to Philippine local
          // government drafting conventions and the statutory basis (RA 7160).
          expect(callArgs.messages[0]?.content).toContain('RA 7160');
          expect(callArgs.messages[0]?.content).toContain('Philippine');
        });
      },
    );
    await promise;
  });
});

describe('AiService.checkCompliance', () => {
  it('returns an empty compliance result for unknown jurisdictions without calling Azure', async () => {
    setAzureEnv();
    let createCalls = 0;
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: '' } }] }),
      (create) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content', 'unknown_jurisdiction').then((result) => {
          expect(result).toHaveProperty('issues');
          expect(Array.isArray(result.issues)).toBe(true);
          expect(result.issues).toHaveLength(0);
          // The Azure client should never be constructed for an unknown jurisdiction
          createCalls = create.mock.calls.length;
        });
      },
    );
    await promise;
    expect(createCalls).toBe(0);
  });

  it('merges AI-returned issues with deterministic issues for known jurisdictions', async () => {
    setAzureEnv();
    const aiIssues: ComplianceIssue[] = [
      {
        type: 'suggestion',
        section: 'AI',
        title: 'AI-suggested improvement',
        description: 'Consider adding a clear severability clause.',
        suggestion: 'Add the standard severability wording used in LGU ordinances.',
      },
    ];
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: JSON.stringify({ issues: aiIssues }) } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Short unstructured content without sections.', 'barangay').then((result) => {
          expect(result.issues.some((i) => i.title === 'AI-suggested improvement')).toBe(true);
        });
      },
    );
    await promise;
  });

  it('sends the jurisdiction and full content to Azure in the user message', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: JSON.stringify({ issues: [] }) } }] }),
      (create) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Draft body to be reviewed.', 'municipal').then(() => {
          const callArgs = create.mock.calls[0]?.[0] as {
            max_completion_tokens: number;
            messages: Array<{ role: string; content: string }>;
          };
          expect(callArgs.max_completion_tokens).toBe(2500);
          // The system message should be the static reviewer prompt
          expect(callArgs.messages[0]?.content).toContain('Philippine legal drafting reviewer');
          // The user message should include the jurisdiction and the full draft
          const userMessage = callArgs.messages[1]?.content ?? '';
          expect(userMessage).toContain('municipal');
          expect(userMessage).toContain('Draft body to be reviewed.');
        });
      },
    );
    await promise;
  });

  it('throws when the Azure config is missing for a known jurisdiction', async () => {
    // Known jurisdiction → reaches getConfig() → throws because env is unset.
    // The unknown-jurisdiction branch short-circuits before this, so we test
    // the other branch separately.
    let caught: unknown;
    jest.isolateModules(() => {
      jest.doMock('openai', () => ({
        AzureOpenAI: jest.fn(),
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AiService } = require('./ai.service') as typeof import('./ai.service');
      const service = new AiService();
      service.checkCompliance('Some content.', 'barangay').catch((err: unknown) => {
        caught = err;
      });
    });
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        expect(caught).toBeInstanceOf(Error);
        expect((caught as Error).message).toBe('Azure OpenAI not configured');
        resolve();
      });
    });
  });

  it('falls back to deterministic result when Azure throws', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => new Error('Azure rate limit hit'),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content with no sections.', 'municipal').then((result) => {
          expect(result.issues.length).toBeGreaterThan(0);
        });
      },
    );
    await promise;
  });

  it('falls back to deterministic result when Azure returns malformed JSON', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: 'Here are some thoughts, but no JSON at all.' } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content.', 'city').then((result) => {
          expect(result.issues.length).toBeGreaterThan(0);
        });
      },
    );
    await promise;
  });

  it('falls back to deterministic result when the matched JSON object is not valid JSON', async () => {
    setAzureEnv();
    // The regex matches the first {...} block. If that block is not parseable
    // JSON, JSON.parse throws, the catch fires, and we fall back.
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: '{this is not valid JSON}' } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content.', 'barangay').then((result) => {
          expect(result.issues.length).toBeGreaterThan(0);
        });
      },
    );
    await promise;
  });

  it('handles AI JSON containing a non-array issues field without throwing', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: JSON.stringify({ issues: 'not an array' }) } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content.', 'barangay').then((result) => {
          expect(result.issues.length).toBeGreaterThan(0);
        });
      },
    );
    await promise;
  });

  it('merges nothing when the AI returns an empty issues array', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: JSON.stringify({ issues: [] }) } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content.', 'barangay').then((result) => {
          // The deterministic analyzer should still produce at least one
          // issue, and the empty AI list should not have removed it.
          expect(result.issues.length).toBeGreaterThan(0);
        });
      },
    );
    await promise;
  });

  it('handles AI JSON without an issues field at all', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: JSON.stringify({ summary: 'all good' }) } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content.', 'municipal').then((result) => {
          expect(result.issues.length).toBeGreaterThan(0);
        });
      },
    );
    await promise;
  });

  it('extracts JSON embedded inside prose (the regex looks for the first {...} block)', async () => {
    setAzureEnv();
    const aiIssues: ComplianceIssue[] = [
      {
        type: 'suggestion',
        section: 'AI',
        title: 'Consider adding seal-bearing signature blocks',
        description: 'The draft lacks explicit signature blocks for officials.',
        suggestion: 'Add a signature block with the punong barangay and kagawad names.',
      },
    ];
    const proseWithJson = `Here is my review: ${JSON.stringify({ issues: aiIssues })} Hope that helps!`;
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: proseWithJson } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.checkCompliance('Some content.', 'barangay').then((result) => {
          expect(result.issues.some((i) => i.title === 'Consider adding seal-bearing signature blocks')).toBe(true);
        });
      },
    );
    await promise;
  });
});

describe('AiService.generateSummary', () => {
  it('throws when Azure OpenAI env vars are missing', () => {
    let caught: unknown;
    jest.isolateModules(() => {
      jest.doMock('openai', () => ({
        AzureOpenAI: jest.fn(),
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AiService } = require('./ai.service') as typeof import('./ai.service');
      const service = new AiService();
      service.generateSummary('Some content.').catch((err: unknown) => {
        caught = err;
      });
    });
    return new Promise<void>((resolve) => {
      setImmediate(() => {
        expect(caught).toBeInstanceOf(Error);
        expect((caught as Error).message).toBe('Azure OpenAI not configured');
        resolve();
      });
    });
  });

  it('returns the summary text from the Azure response', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: 'A two-paragraph summary of the ordinance.' } }] }),
      (create) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.generateSummary('Full ordinance text here.').then((r: { summary: string }) => {
          expect(r.summary).toBe('A two-paragraph summary of the ordinance.');
          const callArgs = create.mock.calls[0]?.[0] as {
            max_completion_tokens: number;
            messages: Array<{ role: string; content: string }>;
          };
          expect(callArgs.max_completion_tokens).toBe(1024);
          expect(callArgs.messages[0]?.role).toBe('system');
          // The system prompt should anchor the model to Philippine local
          // government ordinance context so the summary is on-domain.
          expect(callArgs.messages[0]?.content).toContain('Philippine');
          expect(callArgs.messages[0]?.content.toLowerCase()).toContain('ordinance');
          expect(callArgs.messages[1]?.content).toContain('Full ordinance text here.');
        });
      },
    );
    await promise;
  });

  it('returns an empty summary when the Azure response has no content', async () => {
    setAzureEnv();
    const promise = withMockedOpenAi(
      () => ({ choices: [{ message: { content: null } }] }),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AiService } = require('./ai.service') as typeof import('./ai.service');
        const service = new AiService();
        return service.generateSummary('Some content.').then((r: { summary: string }) => {
          expect(r.summary).toBe('');
        });
      },
    );
    await promise;
  });
});
