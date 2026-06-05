# Tests

This monorepo has unit tests in two places, both using **vitest** for the web app and shared package, and **jest** for the NestJS API.

## Layout

```
apps/
├── api/                # NestJS backend
│   └── src/
│       ├── ai/         # ai.service.spec.ts        (jest)
│       ├── auth/       # auth.guard.spec.ts, auth.service.spec.ts
│       ├── common/     # throttler-behind-auth.guard.spec.ts
│       ├── compliance/ # compliance.service.spec.ts
│       ├── drafts/     # drafts.service.spec.ts
│       └── templates/  # templates.service.spec.ts
└── web/                # Next.js frontend
    └── tests/
        ├── api-client.test.ts              # typed fetch wrapper
        ├── compliance-analysis.test.ts     # RA 7160 deterministic rules
        ├── draft-content.test.ts           # section parsing, normalization
        ├── email.test.ts                   # email provider + templates
        ├── schemas.test.ts                 # zod schema validation
        ├── template-utils.test.ts          # template content extraction
        └── text-diff.test.ts               # line/section diffing
```

The shared package (`@lexigov/shared`) has no `src/**/*.test.ts` files of its own; the tests for shared logic (compliance, draft-content, text-diff, schemas, template-utils) live in `apps/web/tests/` and import from `@lexigov/shared`.

## Running

```bash
# All tests (turbo)
pnpm test

# Just the API (jest)
pnpm --filter @lexigov/api test

# Just the web app (vitest)
pnpm --filter @lexigov/web test

# Just the shared package (delegates to web vitest)
pnpm --filter @lexigov/shared test
```

## Conventions

- **Test files** are co-located with their source: `*.spec.ts` for `apps/api/src`, `*.test.ts` for `apps/web/tests/`
- **Prisma doubles** are hand-rolled in test files; no `jest-mock-extended` or similar
- **Azure OpenAI** is mocked via `jest.isolateModules` + `jest.doMock('openai', ...)` because the service uses a dynamic import
- **No flaky network tests** — all external services (Azure, Better Auth) are mocked
- **Coverage targets** the high-value domain logic (RA 7160 rules, version control, permission checks) rather than reaching a percentage
