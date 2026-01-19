# Google AI Studio Integration Guide

## Overview

LexiGov AI uses Google's Gemini models via **Google AI Studio** for ordinance generation, compliance checking, and summarization. This integration uses the `@google/generative-ai` SDK with a simple API Key.

## Configuration

The integration is configured in `apps/api/.env`:

```bash
GEMINI_API_KEY="AIzaSy..."
```

## Models Used

- **Gemini 2.0 Flash** (`gemini-2.0-flash`): Used for standard generation and summaries. Fast and cost-effective.
- **Gemini 2.5 Pro** (`gemini-2.5-pro`): Used for compliance checking and complex ordinance generation where reasoning depth is critical.

## Service Implementation

The core logic is in `apps/api/src/services/vertex.ts` (kept the filename for compatibility).

It exports:
- `generateOrdinance(params, useProModel)`
- `checkCompliance(ordinance)`
- `generateExecutiveSummary(ordinance)`
- `suggestLegalReferences(content, jurisdiction)`

## Usage

To use the AI service, ensure you have a valid API Key from [Google AI Studio](https://aistudio.google.com/).

## Troubleshooting

If you encounter `404 Not Found` errors regarding models:
1. Check available models using `curl https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY`
2. Update the model names in `src/services/vertex.ts` if newer versions replace the current ones.
