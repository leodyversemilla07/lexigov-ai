import { describe, expect, it } from 'vitest';
import {
  getClientEnv,
  getServerEnv,
  resetClientEnvCache,
  resetServerEnvCache,
  validateClientEnv,
  validateServerEnv,
} from '../src';

describe('@lexigov/env Package Suite', () => {
  beforeEach(() => {
    resetServerEnvCache();
    resetClientEnvCache();
  });

  describe('validateServerEnv()', () => {
    it('validates a complete server environment configuration', () => {
      const env = validateServerEnv({
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/lexigov',
        BETTER_AUTH_SECRET: 'super-secret-key-at-least-32-chars-long',
        AI_PROVIDER: 'azure',
        AZURE_OPENAI_API_KEY: 'test-key',
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
        AZURE_OPENAI_DEPLOYMENT: 'gpt-4o',
      });

      expect(env.AI_PROVIDER).toBe('azure');
      expect(env.PORT).toBe(4000);
      expect(env.NODE_ENV).toBe('test');
    });

    it('throws a descriptive error when required server variables are missing', () => {
      expect(() => validateServerEnv({})).toThrow(/LexiGov Env Validation Failed/);
    });

    it('caches server environment singleton', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/lexigov';
      process.env.BETTER_AUTH_SECRET = 'super-secret-key-at-least-32-chars-long';

      const env1 = getServerEnv();
      const env2 = getServerEnv();

      expect(env1).toBe(env2);
    });
  });

  describe('validateClientEnv()', () => {
    it('provides defaults for client environment', () => {
      const clientEnv = validateClientEnv({});
      expect(clientEnv.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000');
      expect(clientEnv.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    });

    it('caches client environment singleton', () => {
      const env1 = getClientEnv();
      const env2 = getClientEnv();
      expect(env1).toBe(env2);
    });
  });
});
