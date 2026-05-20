# AGENTS.md - LexiGov AI Development Guide

Guidelines for agentic coding agents working in this repository.

## Project Overview

- **Type:** Full-stack SaaS web application (Next.js + NestJS)
- **Purpose:** AI-powered platform for drafting Philippine local government ordinances (RA 7160 compliant)
- **Language:** TypeScript

## Commands

### Development
```bash
pnpm dev          # Start Next.js dev server + NestJS API (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run vitest tests
```

### Single Test Execution
Tests use vitest: `pnpm test`

## Code Style Guidelines

### General Principles
- Use TypeScript for all files - no plain JavaScript
- Prefer explicit types over `any`
- Use functional components with hooks, not class components
- Keep components small and focused

### Imports (Order matters)
1. React/Next imports
2. External libraries (`better-auth/react`, `@lexigov/ui`)
3. Internal imports (API client, utilities)
4. Component imports (`@/components/ui/...`)
5. Type imports

### File Naming
- Components: `PascalCase` (`AppSidebar.tsx`, `NewDraftForm.tsx`)
- Utilities/hooks: `camelCase` (`useAuth.ts`, `utils.ts`)

### Components
Use `"use client"` for: React hooks, event handlers.

```typescript
"use client";
import { useState } from "react";

export function MyComponent() {
    const [state, setState] = useState(false);
}
```

### Types & Interfaces
```typescript
// Interfaces for object shapes
interface DraftFormData { title: string; documentType: string; }
// Type for unions
type DocumentStatus = "DRAFT" | "REVIEW" | "FINAL";
// Export inferred types from Zod schemas
export type CreateDraftInput = z.infer<typeof createDraftSchema>;
```

### Zod Schemas
- Define in `lib/schemas/`
- Export both schema and inferred type
- Use descriptive error messages

```typescript
export const createDraftSchema = z.object({
    title: z.string().min(1, 'Title is required').min(5, 'Title must be at least 5 characters'),
    documentType: z.enum(['ORDINANCE', 'RESOLUTION', 'MEMORANDUM', 'POLICY']),
})
export type CreateDraftInput = z.infer<typeof createDraftSchema>
```

### Enums
- Use Zod enums for validation (in `lib/schemas/enums.ts`)
- Uppercase for document types/statuses, lowercase for jurisdiction levels

### Error Handling
```typescript
// Components - try/catch with user feedback
try { await api.post('/drafts', formData); router.push(`/drafts/${draftId}`); }
catch (error) { console.error("Failed to create draft:", error); alert("Failed to create draft."); }
finally { setIsSubmitting(false); }

// API - throw descriptive errors
if (!draft || draft.userId !== user.id) throw new Error("Draft not found");
```

### Tailwind CSS
Use `cn()` for conditional classes: `import { cn } from "@/lib/utils";`

### Authentication
- Better Auth for authentication
- `auth.ts` and `auth-client.ts` in `src/lib/` for server and client auth
- API client sends session token automatically from the `better-auth.session_token` cookie

### UI Components (shadcn/ui)
- Import from `@/components/ui/[component-name]`
- Wrap forms in `Card`
- Use `Label` for accessibility

### Environment Variables
```
AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY
AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT
NEXT_PUBLIC_API_URL
DATABASE_URL, AUTH_SECRET, AUTH_BETTER_CALL_DEV
```

## Packages

- `@lexigov/shared` (`packages/shared/`) — shared types, Zod schemas, utilities (`cn()`, `extractDraftSections`, etc.)
- `@lexigov/ui` (`packages/ui/`) — shadcn/ui component primitives, exported barrel from `src/index.ts`

## Directory Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public auth routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (protected)/              # Authenticated routes with sidebar
│   │   ├── _components/          # Shared protected components (if needed)
│   │   ├── dashboard/
│   │   ├── drafts/
│   │   │   ├── [id]/
│   │   │   │   ├── _components/  # Route-specific components
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Shared app components
├── hooks/                        # Custom React hooks
├── lib/
│   ├── schemas/                  # Zod validation schemas
│   └── utils.ts
└── types/                        # Centralized TypeScript types
apps/
├── api/                          # NestJS backend (controllers, services, modules)
├── web/                          # Next.js frontend
public/                           # Static assets
tests/                            # Test files
packages/
├── shared/                       # @lexigov/shared (types, schemas, utilities)
└── ui/                           # @lexigov/ui (shadcn primitives, hooks)
```

## Importing UI Components

Import from `@lexigov/ui`:
```typescript
import { Button, Card, CardContent, Input } from '@lexigov/ui';
```

### File Organization Patterns
- **Private folders** (`_components/`): Use for route-specific components that shouldn't be routes
- **Route groups** (`(auth)/`, `(protected)/`): Organize routes without affecting URL structure
- **Colocation**: Keep route-specific components close to their page in `_components/` folders
- **Shared components**: Place in `src/components/` for app-wide reuse
- **Types**: Export from `src/types/index.ts` for centralized type management
