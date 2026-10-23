import OpenAI from 'openai';
import type {
  AiCompletionResult,
  AiProvider,
  AiProviderConfig,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StreamTextOptions,
} from '../contracts';

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = 'openai-compatible';
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: AiProviderConfig) {
    const baseURL = config.baseUrl || config.endpoint || 'http://localhost:11434/v1';

    this.client = new OpenAI({
      apiKey: config.apiKey || 'not-needed-for-local',
      baseURL,
      dangerouslyAllowBrowser: true,
    });

    this.defaultModel = config.model || config.deployment || 'llama3';
  }

  async generateText(options: GenerateTextOptions): Promise<AiCompletionResult> {
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system' as const, content: options.systemPrompt });
    }
    messages.push({ role: 'user' as const, content: options.prompt });

    const completion = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens ?? 8192,
    });

    const text = completion.choices[0]?.message?.content ?? '';

    return {
      text,
      model: completion.model || this.defaultModel,
      provider: this.name,
      finishReason: completion.choices[0]?.finish_reason || 'stop',
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *streamText(options: StreamTextOptions): AsyncIterable<string> {
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system' as const, content: options.systemPrompt });
    }
    messages.push({ role: 'user' as const, content: options.prompt });

    const stream = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens ?? 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        if (options.onToken) {
          options.onToken(token);
        }
        yield token;
      }
    }
  }

  async generateStructured<T = unknown>(options: GenerateStructuredOptions<T>): Promise<T> {
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system' as const, content: options.systemPrompt });
    }
    messages.push({ role: 'user' as const, content: options.prompt });

    // For OpenAI-compatible endpoints that support response_format
    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature ?? 0.1,
        response_format: options.jsonSchema
          ? ({
              type: 'json_schema',
              json_schema: { name: 'compliance_analysis', schema: options.jsonSchema, strict: false },
            } as never)
          : ({ type: 'json_object' } as never),
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      return JSON.parse(raw) as T;
    } catch {
      // Fallback: request JSON in prompt and parse markdown code fence
      const completion = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: [
          ...messages,
          {
            role: 'system' as const,
            content: 'CRITICAL: Return ONLY valid JSON with no markdown wrapping or text before/after.',
          },
        ],
        temperature: options.temperature ?? 0.1,
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const cleanJson = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleanJson) as T;
    }
  }
}
