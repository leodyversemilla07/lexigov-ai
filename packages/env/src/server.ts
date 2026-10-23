import { z } from 'zod';

export const aiProviderEnum = z.enum([
  'azure',
  'openai',
  'gemini',
  'anthropic',
  'openai-compatible',
  'mock',
]);

export type AiProvider = z.infer<typeof aiProviderEnum>;

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.string().optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // AI Orchestration Configuration
  AI_PROVIDER: aiProviderEnum.default('azure'),
  AI_MODEL: z.string().optional(),
  AI_FALLBACK_PROVIDERS: z.string().optional(),

  // Azure OpenAI Credentials
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),

  // OpenAI Credentials
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),

  // Google Gemini Credentials
  GEMINI_API_KEY: z.string().optional(),

  // Anthropic Claude Credentials
  ANTHROPIC_API_KEY: z.string().optional(),

  // Custom / Ollama / vLLM / DeepSeek / Sovereign GovCloud Credentials
  CUSTOM_AI_BASE_URL: z.string().optional(),
  CUSTOM_AI_API_KEY: z.string().optional(),
  CUSTOM_AI_MODEL: z.string().optional(),

  // Artifact Storage (S3 / S3-compatible) - optional, in-memory fallback when unset
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function validateServerEnv(rawEnv: Record<string, unknown> = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const formatted = result.error.format();
    const errorMessage = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => `  - ${key}: ${(value as { _errors: string[] })._errors?.join(', ')}`)
      .join('\n');

    throw new Error(`\n[LexiGov Env Validation Failed] Missing or invalid server environment variables:\n${errorMessage}\n`);
  }

  return result.data;
}

export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = validateServerEnv(process.env);
  }
  return cachedServerEnv;
}

export function resetServerEnvCache(): void {
  cachedServerEnv = null;
}
