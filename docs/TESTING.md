# Testing Guide — LexiGov AI

This document establishes the official testing standards, architectures, conventions, and patterns for the LexiGov AI platform.

---

## 1. Monorepo Testing Topology

- **`apps/web`**: Next.js App Router frontend, page routes, and UI components tested via **Vitest** + **React Testing Library**.
- **`apps/api`**: NestJS backend modules, services, guards, and controllers tested via **Jest** + **ts-jest**.
- **`packages/shared`**: Core types, Zod schemas, utilities, and test data factories tested via **Vitest**.
- **`packages/ai`**: Multi-provider adapters (Azure, OpenAI, Gemini, Anthropic, Ollama), prompt templates, and fallback chains tested via **Vitest**.
- **`packages/env`**: Server and client environment variable validation tested via **Vitest**.
- **`tests/e2e`**: End-to-end full-stack user journeys automated via **Playwright**.

---

## 2. Naming Standards & Conventions

### 2.1. File Extensions & Locations

| Scope | Suffix | Location | Runner |
|---|---|---|---|
| **Backend Unit / Guard Tests** | `*.service.spec.ts`, `*.guard.spec.ts` | Colocated in `apps/api/src/` | Jest |
| **Backend Controller E2E** | `*.e2e-spec.ts` | `apps/api/test/` | Jest + Supertest |
| **React Component Tests** | `*.test.tsx` | Colocated in `_components/` | Vitest + React Testing Library |
| **Shared Package Tests** | `*.test.ts` | `packages/*/tests/` | Vitest |
| **Browser E2E Tests** | `*.spec.ts` | Root `tests/e2e/` | Playwright |

### 2.2. Test Block Phrasing

Use active, present-tense sentences following the formula:
**`[Verb / Action] + [Expected Outcome] + [When / Given Condition]`**

```typescript
// ❌ Avoid
it('should work', () => {});
it('test draft save', () => {});

// ✅ Recommended
it('returns 409 Conflict when expectedVersion does not match current draft version', async () => {});
it('advances legislative stage to FIRST_READING and creates a workflow audit transition', async () => {});
it('falls back to MockAiProvider when cloud API keys are missing in test environment', () => {});
```

---

## 3. Type-Safe Test Data Factories (`@lexigov/shared/testing`)

Always prefer centralized builder factories over ad-hoc mock objects to prevent test drift as schemas evolve:

```typescript
import {
  createMockDraft,
  createMockUser,
  createMockMilestones,
  createMockComplianceResult,
  createMockOrganization,
} from '@lexigov/shared';

// Create a draft with specific overrides
const draft = createMockDraft({
  status: 'COMMITTEE_REVIEW',
  version: 3,
});

// Create a user with specific role
const presidingOfficer = createMockUser({
  role: 'PRESIDING_OFFICER',
});
```

---

## 4. Zero-Network AI Mocking

Never invoke real cloud AI endpoints during automated test runs. Use the in-memory `MockAiProvider`:

```typescript
import { MockAiProvider } from '@lexigov/ai';

const mockAi = new MockAiProvider();
mockAi.setCannedResponse('Plastic Ordinance', 'SECTION 1. Ban on single-use plastics.');
aiService.setProvider(mockAi);
```

---

## 5. Frontend `data-testid` Standards

Use **Hierarchical Dot Notation** for test IDs on interactive or state-bearing elements:

```
data-testid="<domain>.<component>.<element-type>"
```

### Examples:
- `data-testid="workflow.panel.status-badge"`
- `data-testid="workflow.panel.status-select"`
- `data-testid="draft.editor.save-btn"`
- `data-testid="compliance.pulse.overall-score"`

---

## 6. Execution Commands

```bash
# Run all tests across the monorepo via Turborepo
pnpm test

# Run individual package/app test suites
pnpm --filter @lexigov/shared test
pnpm --filter @lexigov/ai test
pnpm --filter @lexigov/env test
pnpm --filter @lexigov/api test
pnpm --filter @lexigov/web test

# Run linter checks
pnpm lint

# Format all workspace files
pnpm format
```
