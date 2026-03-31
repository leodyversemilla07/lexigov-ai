# AGENTS.md - LexiGov AI Development Guide

Guidelines for agentic coding agents working in this repository.

## Project Overview

- **Type:** Full-stack SaaS web application (Next.js + Convex)
- **Purpose:** AI-powered platform for drafting Philippine local government ordinances (RA 7160 compliant)
- **Language:** TypeScript

## Commands

### Development
```bash
npm run dev          # Start Next.js dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Convex (Backend)
```bash
npx convex dev       # Start Convex dev server (runs alongside npm run dev)
npx convex deploy    # Deploy Convex backend to production
```

### Single Test Execution
This project does not have a dedicated test framework. For manual testing use `npm run dev`.

## Code Style Guidelines

### General Principles
- Use TypeScript for all files - no plain JavaScript
- Prefer explicit types over `any`
- Use functional components with hooks, not class components
- Keep components small and focused

### Imports (Order matters)
1. React/Next imports
2. External libraries (`@clerk/nextjs`, `convex/react`)
3. Internal imports (Convex API, utilities)
4. Component imports (`@/components/ui/...`)
5. Type imports

### File Naming
- Components: `PascalCase` (`AppSidebar.tsx`, `NewDraftForm.tsx`)
- Utilities/hooks: `camelCase` (`useAuth.ts`, `utils.ts`)
- Convex functions: `camelCase` (`drafts.ts`, `users.ts`)

### Components
Use `"use client"` for: React hooks, Convex hooks, event handlers.

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
try { await createDraft(formData); router.push(`/drafts/${draftId}`); }
catch (error) { console.error("Failed to create draft:", error); alert("Failed to create draft."); }
finally { setIsSubmitting(false); }

// Convex - throw descriptive errors
if (!draft || draft.userId !== user._id) throw new Error("Draft not found");
```

### Tailwind CSS
Use `cn()` for conditional classes: `import { cn } from "@/lib/utils";`

### Convex (Backend)
**Queries** - read-only, **Mutations** - write operations.

```typescript
export const list = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];
    },
});
```

### Authentication
- Clerk for authentication
- `UserBootstrap` component syncs users to Convex
- `requireCurrentUser()` for protected, `getCurrentUser()` for optional

### UI Components (shadcn/ui)
- Import from `@/components/ui/[component-name]`
- Wrap forms in `Card`
- Use `Label` for accessibility

### Environment Variables
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL, NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL, NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
NEXT_PUBLIC_CONVEX_URL, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY
AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT
```

## Directory Structure
```
app/                    # Next.js App Router
  (auth)/              # Public auth routes
  (protected)/         # Authenticated routes with sidebar
components/ui/         # shadcn/ui components
convex/                # Backend (queries, mutations, AI)
lib/schemas/           # Zod validation schemas
hooks/                 # Custom React hooks
```
