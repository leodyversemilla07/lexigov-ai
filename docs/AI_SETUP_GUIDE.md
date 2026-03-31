# Azure OpenAI Integration Guide

## Overview

LexiGov AI uses Azure OpenAI for ordinance generation, compliance checking, and summarization. The backend integration is implemented with the official `openai` TypeScript SDK and Azure OpenAI credentials.

## Configuration

Set these environment variables in the project root `.env.local` and in your Convex deployment environment:

```bash
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="..."
AZURE_OPENAI_API_VERSION="..."
AZURE_OPENAI_DEPLOYMENT="..."
```

## Deployment Requirement

`AZURE_OPENAI_DEPLOYMENT` must be the name of an Azure OpenAI chat-model deployment that supports ordinance drafting and compliance analysis for your workload.

## Service Implementation

The core logic is in `convex/ai.ts`.

It exports:
- `generateOrdinance`
- `checkCompliance`
- `generateSummary`

## Usage Notes

- The Convex node actions call Azure OpenAI directly from the server.
- Draft metadata stores the deployment name returned by the generation flow.
- The frontend labels are provider-agnostic except where Azure OpenAI is shown explicitly.

## Troubleshooting

If requests fail:
1. Confirm the Azure OpenAI resource endpoint is correct and includes `https://`.
2. Confirm the API key is active for that resource.
3. Confirm `AZURE_OPENAI_API_VERSION` matches a version supported by your Azure resource.
4. Confirm `AZURE_OPENAI_DEPLOYMENT` matches an existing deployment name, not just a base model family name.
