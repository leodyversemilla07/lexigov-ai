import { AzureOpenAI } from 'openai';
import type {
  AiCompletionResult,
  AiProvider,
  AiProviderConfig,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StreamTextOptions,
} from '../contracts';

export class AzureOpenAiProvider implements AiProvider {
  readonly name = 'azure';
  private client: AzureOpenAI;
  private deployment: string;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey || !config.endpoint) {
      throw new Error('AzureOpenAiProvider requires apiKey and endpoint configuration.');
    }

    this.client = new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      apiVersion: config.apiVersion || '2024-08-01-preview',
      dangerouslyAllowBrowser: true,
    });

    this.deployment = config.deployment || 'gpt-4o';
  }

  async generateText(options: GenerateTextOptions): Promise<AiCompletionResult> {
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system' as const, content: options.systemPrompt });
    }
    messages.push({ role: 'user' as const, content: options.prompt });

    const completion = await this.client.chat.completions.create({
      model: options.model || this.deployment,
      messages,
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens ?? 8192,
    });

    const text = completion.choices[0]?.message?.content ?? '';

    return {
      text,
      model: completion.model || this.deployment,
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
      model: options.model || this.deployment,
      messages,
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens ?? 8192,
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

    const completion = await this.client.chat.completions.create({
      model: options.model || this.deployment,
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
  }
}
