export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamTextOptions extends GenerateTextOptions {
  onToken?: (token: string) => void;
}

export interface GenerateStructuredOptions<T = unknown> extends GenerateTextOptions {
  schema?: unknown;
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiCompletionResult {
  text: string;
  model: string;
  provider: string;
  finishReason?: string;
  usage?: AiUsage;
}

export interface AiProviderConfig {
  apiKey?: string;
  endpoint?: string;
  apiVersion?: string;
  deployment?: string;
  model?: string;
  baseUrl?: string;
}

export interface AiProvider {
  readonly name: string;
  generateText(options: GenerateTextOptions): Promise<AiCompletionResult>;
  streamText(options: StreamTextOptions): AsyncIterable<string>;
  generateStructured<T = unknown>(options: GenerateStructuredOptions<T>): Promise<T>;
}
