import type {
  AiCompletionResult,
  AiProvider,
  AiProviderConfig,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StreamTextOptions,
} from '../contracts';

export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private apiKey: string;
  private defaultModel: string;
  private baseUrl: string;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('AnthropicProvider requires apiKey configuration (ANTHROPIC_API_KEY).');
    }

    this.apiKey = config.apiKey;
    this.defaultModel = config.model || 'claude-3-7-sonnet-20250219';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  async generateText(options: GenerateTextOptions): Promise<AiCompletionResult> {
    const model = options.model || this.defaultModel;
    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? 8192,
      temperature: options.temperature ?? 0.7,
      messages: [{ role: 'user', content: options.prompt }],
    };

    if (options.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API Error (${response.status}): ${err}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
      model: string;
      stop_reason?: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const text = data.content
      .filter((c) => c.type === 'text' && c.text)
      .map((c) => c.text)
      .join('');

    return {
      text,
      model: data.model || model,
      provider: this.name,
      finishReason: data.stop_reason || 'stop',
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  async *streamText(options: StreamTextOptions): AsyncIterable<string> {
    const model = options.model || this.defaultModel;
    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? 8192,
      temperature: options.temperature ?? 0.7,
      stream: true,
      messages: [{ role: 'user', content: options.prompt }],
    };

    if (options.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic Stream Error (${response.status}): ${err}`);
    }

    if (!response.body) {
      throw new Error('Anthropic response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr) as {
              type: string;
              delta?: { type: string; text?: string };
            };
            if (event.type === 'content_block_delta' && event.delta?.text) {
              const token = event.delta.text;
              if (options.onToken) {
                options.onToken(token);
              }
              yield token;
            }
          } catch {
            // Ignore parse errors on partial lines
          }
        }
      }
    }
  }

  async generateStructured<T = unknown>(options: GenerateStructuredOptions<T>): Promise<T> {
    const schemaInstructions = options.jsonSchema
      ? `\nRespond with a JSON object conforming to this JSON Schema:\n${JSON.stringify(options.jsonSchema)}`
      : '';

    const result = await this.generateText({
      ...options,
      systemPrompt: `${options.systemPrompt || ''}\nCRITICAL: Respond ONLY with valid JSON with no markdown wrapping.${schemaInstructions}`,
    });

    const clean = result.text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(clean) as T;
  }
}
