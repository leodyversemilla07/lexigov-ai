import type {
  AiCompletionResult,
  AiProvider,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StreamTextOptions,
} from './contracts';

export interface FallbackOptions {
  maxRetriesPerProvider?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = (error as { message?: string }).message?.toLowerCase() || '';
  const status = (error as { status?: number }).status;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('quota') ||
    msg.includes('timeout') ||
    msg.includes('connection refused')
  );
}

export class ResilientFallbackProvider implements AiProvider {
  readonly name: string;
  private providers: AiProvider[];
  private options: Required<FallbackOptions>;

  constructor(providers: AiProvider[], options?: FallbackOptions) {
    if (!providers || providers.length === 0) {
      throw new Error('ResilientFallbackProvider requires at least one AiProvider.');
    }

    this.providers = providers;
    this.name = `fallback(${providers.map((p) => p.name).join('->')})`;
    this.options = {
      maxRetriesPerProvider: options?.maxRetriesPerProvider ?? 2,
      initialBackoffMs: options?.initialBackoffMs ?? 500,
      maxBackoffMs: options?.maxBackoffMs ?? 4000,
    };
  }

  getPrimaryProvider(): AiProvider {
    return this.providers[0]!;
  }

  getProviders(): AiProvider[] {
    return [...this.providers];
  }

  private async executeWithRetry<T>(
    operationName: string,
    execute: (provider: AiProvider) => Promise<T>,
  ): Promise<T> {
    const errors: Array<{ provider: string; error: unknown }> = [];

    for (const provider of this.providers) {
      let backoff = this.options.initialBackoffMs;

      for (let attempt = 0; attempt <= this.options.maxRetriesPerProvider; attempt++) {
        try {
          return await execute(provider);
        } catch (error) {
          errors.push({ provider: provider.name, error });

          if (attempt < this.options.maxRetriesPerProvider && isRetryableError(error)) {
            const jitter = Math.random() * 200;
            await delay(Math.min(backoff + jitter, this.options.maxBackoffMs));
            backoff *= 2;
            continue;
          }
          break; // Fall through to next provider in chain
        }
      }
    }

    const failureSummary = errors
      .map((e) => `[${e.provider}] ${e.error instanceof Error ? e.error.message : String(e.error)}`)
      .join('; ');

    throw new Error(`All AI providers in fallback chain failed for ${operationName}: ${failureSummary}`);
  }

  async generateText(options: GenerateTextOptions): Promise<AiCompletionResult> {
    return this.executeWithRetry('generateText', (provider) => provider.generateText(options));
  }

  async *streamText(options: StreamTextOptions): AsyncIterable<string> {
    // For streaming, resolve the working provider via fallback
    let lastError: unknown;

    for (const provider of this.providers) {
      let emittedOutput = false;
      try {
        const stream = provider.streamText(options);
        for await (const token of stream) {
          emittedOutput = true;
          yield token;
        }
        return;
      } catch (error) {
        lastError = error;
        // Restarting with another model after output was delivered would concatenate
        // two unrelated completions into one ordinance. Fail visibly instead.
        if (emittedOutput) throw error;
      }
    }

    throw lastError || new Error('All streaming providers in fallback chain failed.');
  }

  async generateStructured<T = unknown>(options: GenerateStructuredOptions<T>): Promise<T> {
    return this.executeWithRetry('generateStructured', (provider) => provider.generateStructured<T>(options));
  }
}
