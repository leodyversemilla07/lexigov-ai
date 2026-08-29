import { z } from 'zod';

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cachedClientEnv: ClientEnv | null = null;

export function validateClientEnv(rawEnv: Record<string, unknown> = process.env): ClientEnv {
  const result = clientEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const formatted = result.error.format();
    const errorMessage = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => `  - ${key}: ${(value as { _errors: string[] })._errors?.join(', ')}`)
      .join('\n');

    throw new Error(`\n[LexiGov Env Validation Failed] Missing or invalid client environment variables:\n${errorMessage}\n`);
  }

  return result.data;
}

export function getClientEnv(): ClientEnv {
  if (!cachedClientEnv) {
    cachedClientEnv = validateClientEnv({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
  }
  return cachedClientEnv;
}

export function resetClientEnvCache(): void {
  cachedClientEnv = null;
}
