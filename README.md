# LexiGov AI

An AI-powered platform for drafting **RA 7160-compliant** local government ordinances for Philippine Local Government Units (LGUs).

---

## Overview

LexiGov AI streamlines the ordinance creation process by combining Azure OpenAI with a structured document workflow. It supports multiple jurisdiction levels (Barangay, City, Municipal, Provincial) and document types (Ordinance, Resolution, Memorandum, Policy), with built-in RA 7160 compliance checking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript |
| Auth | [Clerk](https://clerk.com) |
| Database / Backend | [Convex](https://convex.dev) (real-time, serverless) |
| AI | [Azure OpenAI](https://learn.microsoft.com/azure/ai-services/openai/overview) via `openai` |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Forms | React Hook Form + Zod |
| Fonts | [Geist](https://vercel.com/font) (local, via `geist` npm package) |

---

## Features

- **AI Ordinance Generation** — Generate complete, professionally formatted ordinances from a plain-language prompt using Azure OpenAI
- **RA 7160 Compliance Checking** — Automated compliance scoring against the Local Government Code of 1991
- **Draft Management** — Create, edit, and track ordinance drafts through a status workflow (Draft → Review → Final → Archived)
- **Template Library** — Reusable ordinance templates by category and jurisdiction level, with manual and AI draft entry points
- **Version History & Compare** — Each substantive save snapshots the prior draft state and enables line-by-line comparison between revisions
- **Compliance History** — Saved compliance reports are tracked per draft version for later review
- **Export** — Export drafts and saved revisions to TXT, Markdown, DOCX, and PDF
- **Role-Based Access** — Roles: Admin, Legislative Staff, Barangay Secretary, City Council, Researcher
- **Collapsible Sidebar** — shadcn sidebar-07 with collapse-to-icons navigation

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx             # Landing page (public) → /
│   ├── layout.tsx           # Root layout (Clerk, Convex, theme)
│   ├── (auth)/              # Public auth routes (no layout)
│   │   ├── sign-in/         # → /sign-in
│   │   └── sign-up/         # → /sign-up
│   └── (protected)/         # Route group — shared sidebar layout, Clerk-protected
│       ├── layout.tsx        # Sidebar + header layout (no URL prefix added)
│       ├── dashboard/        # → /dashboard  (overview & stats)
│       ├── drafts/           # → /drafts     (draft list)
│       │   ├── [id]/         # → /drafts/[id] (draft editor)
│       │   │   ├── _components/  # Route-specific components
│       │   │   └── page.tsx
│       │   └── new/          # → /drafts/new  (create draft)
│       ├── templates/        # → /templates
│       ├── compliance/       # → /compliance
│       ├── export/           # → /export
│       └── settings/         # → /settings
├── components/
│   ├── app-sidebar.tsx       # LexiGov navigation sidebar (shadcn sidebar-07)
│   ├── header.tsx            # Top header with sidebar trigger, search, user menu
│   ├── nav-main.tsx          # Flat NavLinks with active-route detection via usePathname
│   └── ui/                   # shadcn/ui primitives
├── hooks/                    # Custom React hooks
├── lib/
│   ├── schemas/              # Shared Zod schemas (enums, draft, template, auth, ai)
│   ├── draft-content.ts      # Draft parsing and normalization
│   ├── compliance-analysis.ts # RA 7160 compliance rules
│   └── utils.ts              # Utility functions
└── types/                    # Centralized TypeScript type exports
convex/
├── schema.ts                 # Database schema (users, drafts, templates, complianceReports)
├── drafts.ts                 # Draft queries and mutations
├── templates.ts              # Template queries and mutations
├── ai.ts                     # Azure OpenAI actions (generation, compliance, summary)
└── users.ts                  # User sync with Clerk
public/                       # Static assets
tests/                        # Test files
```

### Code Organization Principles

- **`src/` directory**: All application code lives inside `src/` for clean separation from config files
- **Private folders** (`_components/`): Route-specific components prefixed with `_` are excluded from routing
- **Route groups** (`(auth)/`, `(protected)/`): Organize routes without affecting URL structure
- **Colocation**: Components used by a single route live in that route's `_components/` folder
- **Shared components**: App-wide components in `src/components/`
- **Centralized types**: All type exports available from `src/types/index.ts`

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Clerk](https://clerk.com) account
- A [Convex](https://convex.dev) account
- An Azure OpenAI resource with a deployed chat model

### Installation

```bash
git clone https://github.com/leodyversemilla07/lexigov-ai.git
cd lexigov-ai
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_VERSION=...
AZURE_OPENAI_DEPLOYMENT=...
```

### Run the Development Server

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Convex backend
npx convex dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Current MVP Boundaries

- Supported exports: `txt`, `md`, `docx`, `pdf`
- Saved template flow is active from `/templates` into `/drafts/new` and `/ai`
- Draft edits create saved revision snapshots that can be compared in `/compare`
- Compliance reports are persisted with draft version metadata
- The `docs/` folder contains archived planning material from an older Prisma/Firebase architecture and should not be used as the source of truth for the running app

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx convex dev` | Start Convex backend in watch mode |
| `npx convex deploy` | Deploy Convex functions to production |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub and import the repository at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.local` to the Vercel project settings
3. Deploy — Vercel auto-detects Next.js

### Convex

```bash
npx convex deploy
```

Set `CONVEX_DEPLOY_KEY` in your CI/CD environment for automated deployments.
