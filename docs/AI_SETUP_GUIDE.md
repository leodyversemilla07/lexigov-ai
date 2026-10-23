# AI Provider Setup Guide

LexiGov’s provider-neutral AI layer is implemented in `packages/ai`. NestJS consumes it from `apps/api/src/ai/ai.service.ts`. No Convex runtime is used.

## Select a provider

Set `AI_PROVIDER` in the API environment to one of:

- `azure`
- `openai`
- `gemini`
- `anthropic`
- `openai-compatible`
- `mock` (development and tests only)

`AI_MODEL` optionally overrides the provider’s default model. `AI_FALLBACK_PROVIDERS` accepts a comma-separated fallback provider list. In production, startup fails if no configured provider can be created; mock fallback is intentionally disabled.

## Azure OpenAI

```env
AI_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_VERSION=2024-10-21
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

The deployment must support chat completion for the requested workload.

## OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
AI_MODEL=gpt-4o
# Optional proxy-compatible endpoint:
# OPENAI_BASE_URL=https://api.openai.com/v1
```

## Gemini

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
AI_MODEL=gemini-2.0-flash
```

## Anthropic

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
AI_MODEL=claude-sonnet-4-5
```

## OpenAI-compatible services

Use this adapter for a compatible sovereign cloud, vLLM, Ollama gateway, or other approved endpoint:

```env
AI_PROVIDER=openai-compatible
CUSTOM_AI_BASE_URL=https://approved-endpoint.example/v1
CUSTOM_AI_API_KEY=...
CUSTOM_AI_MODEL=approved-model
```

## Fallback example

```env
AI_PROVIDER=azure
AI_FALLBACK_PROVIDERS=openai,anthropic
```

Only fully configured providers enter the chain. Streaming falls back only before any output has been emitted; after partial output, the request fails rather than concatenating responses from different models.

## Validation and legal boundary

Compliance augmentation must return the runtime-validated issue contract defined in `packages/shared/src/schemas/ai.ts`. Invalid provider output is discarded in favor of deterministic analysis.

AI output and automated compliance scores are advisory. They require review by an authorized LGU official or legal officer and do not certify enactment, publication, authenticity, or legal validity.

## Troubleshooting

1. Confirm API environment variables are set in `apps/api/.env` or the deployment environment.
2. Verify the selected provider’s credentials and endpoint.
3. Confirm the configured model/deployment supports chat completions.
4. Check NestJS logs for provider configuration errors.
5. Test provider behavior with `pnpm --filter @lexigov/ai test`.
