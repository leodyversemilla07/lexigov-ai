import type { ServerEnv } from '@lexigov/env';
import type { AiProvider, AiProviderConfig } from './contracts';
import { ResilientFallbackProvider } from './fallback';
import { AnthropicProvider } from './providers/anthropic';
import { AzureOpenAiProvider } from './providers/azure';
import { GeminiProvider } from './providers/gemini';
import { MockAiProvider } from './providers/mock';
import { OpenAiProvider } from './providers/openai';
import { OpenAiCompatibleProvider } from './providers/openai-compatible';

export type AiProviderName = 'azure' | 'openai' | 'gemini' | 'anthropic' | 'openai-compatible' | 'mock';

export function createSingleProvider(name: AiProviderName, config: AiProviderConfig): AiProvider {
  switch (name) {
    case 'azure':
      return new AzureOpenAiProvider(config);
    case 'openai':
      return new OpenAiProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai-compatible':
      return new OpenAiCompatibleProvider(config);
    case 'mock':
      return new MockAiProvider();
    default:
      throw new Error(`Unsupported AI provider: ${name as string}`);
  }
}

export function createAiProviderFromEnv(env: Partial<ServerEnv>): AiProvider {
  const primaryProviderName = (env.AI_PROVIDER || 'azure') as AiProviderName;

  const buildConfigFor = (name: AiProviderName): AiProviderConfig => {
    switch (name) {
      case 'azure':
        return {
          apiKey: env.AZURE_OPENAI_API_KEY,
          endpoint: env.AZURE_OPENAI_ENDPOINT,
          apiVersion: env.AZURE_OPENAI_API_VERSION,
          deployment: env.AZURE_OPENAI_DEPLOYMENT,
          model: env.AI_MODEL,
        };
      case 'openai':
        return {
          apiKey: env.OPENAI_API_KEY,
          baseUrl: env.OPENAI_BASE_URL,
          model: env.AI_MODEL,
        };
      case 'gemini':
        return {
          apiKey: env.GEMINI_API_KEY,
          model: env.AI_MODEL,
        };
      case 'anthropic':
        return {
          apiKey: env.ANTHROPIC_API_KEY,
          model: env.AI_MODEL,
        };
      case 'openai-compatible':
        return {
          apiKey: env.CUSTOM_AI_API_KEY,
          baseUrl: env.CUSTOM_AI_BASE_URL,
          model: env.CUSTOM_AI_MODEL || env.AI_MODEL,
        };
      case 'mock':
      default:
        return {};
    }
  };

  const fallbackNames = (env.AI_FALLBACK_PROVIDERS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) as AiProviderName[];

  const providerNamesToBuild = [primaryProviderName, ...fallbackNames.filter((f) => f !== primaryProviderName)];

  const instantiatedProviders: AiProvider[] = [];

  for (const name of providerNamesToBuild) {
    try {
      const config = buildConfigFor(name);
      instantiatedProviders.push(createSingleProvider(name, config));
    } catch {
      // If a fallback provider is missing credentials, skip it
      if (name === primaryProviderName && providerNamesToBuild.length === 1) {
        // Fallback to MockAiProvider in dev/test if primary is unconfigured
        if (env.NODE_ENV !== 'production') {
          return new MockAiProvider();
        }
        throw new Error(`Primary AI provider '${name}' is misconfigured or missing credentials.`);
      }
    }
  }

  if (instantiatedProviders.length === 0) {
    return new MockAiProvider();
  }

  if (instantiatedProviders.length === 1) {
    return instantiatedProviders[0]!;
  }

  return new ResilientFallbackProvider(instantiatedProviders);
}
