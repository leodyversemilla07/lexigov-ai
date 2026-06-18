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
| Auth | [Better Auth](https://better-auth.com) |
| Database / Backend | [NestJS](https://nestjs.com) + [PostgreSQL](https://postgresql.org) |
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
│   ├── layout.tsx           # Root layout (Better Auth, theme)
│   ├── (auth)/              # Public auth routes (no layout)
│   │   ├── sign-in/         # → /sign-in
│   │   └── sign-up/         # → /sign-up
│   └── (protected)/         # Route group — shared sidebar layout, protected by Next proxy + API auth
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
│   └── auth/                 # Auth forms and auth-aware actions
├── hooks/                    # Custom React hooks
├── lib/
│   ├── auth.ts               # Better Auth server configuration
│   ├── auth-client.ts        # Better Auth browser client
│   ├── api-client.ts         # Typed fetch wrapper for NestJS API
│   ├── api-hooks.ts          # useApiQuery / useApiMutation hooks
│   ├── email/                # Email providers and templates
│   └── prisma.ts             # Prisma adapter client for Better Auth
└── types/                    # Centralized TypeScript type exports
apps/
├── api/                      # NestJS backend (controllers, services, modules)
└── web/                      # Next.js frontend
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
- An Azure OpenAI resource with a deployed chat model
- PostgreSQL (for NestJS API)

### Installation

```bash
git clone https://github.com/leodyversemilla07/lexigov-ai.git
cd lexigov-ai
pnpm install
```

### Environment Variables

Create `apps/web/.env` and `apps/api/.env` with the relevant variables below:

```env
# Auth (Better Auth)
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lexigov?schema=public

# API
NEXT_PUBLIC_API_URL=http://localhost:4000/api
API_PORT=4000
CORS_ORIGIN=http://localhost:3000

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_VERSION=2024-10-21
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Database Setup

After PostgreSQL is running and `DATABASE_URL` is set in `apps/api/.env` and `apps/web/.env`:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The seed step creates a system template-library user and starter public ordinance/resolution templates.

### Run the Development Server

```bash
pnpm dev
```

This starts both Next.js (web) and NestJS (API) concurrently. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
| `pnpm dev` | Start Next.js + NestJS dev servers (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | Run Biome checks |
| `pnpm test` | Run web Vitest tests and API Jest tests |
| `pnpm db:generate` | Generate the Prisma client for the API |
| `pnpm db:migrate` | Run Prisma migrations against `apps/api/.env` |
| `pnpm db:seed` | Seed starter public templates |
| `pnpm db:studio` | Open Prisma Studio |

---

## Docker

A `docker-compose.yml` is provided for running the full stack (PostgreSQL + API + Web) in production-like containers.

### Prerequisites

- [Docker](https://docker.com) & [Docker Compose](https://docs.docker.com/compose/) v2
- A `.env` file with required secrets (see below)

### Setup

Create a `.env` file in the project root with at minimum:

```env
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_VERSION=2024-10-21
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

Then run:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on port `5432`
- NestJS API on port `4000`
- Next.js web app on port `3000`

### Initialise the database

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec -w /app/apps/api api npx prisma db seed
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub and import the repository at [vercel.com/new](https://vercel.com/new)
2. Add all required environment variables to the Vercel project settings
3. Deploy — Vercel auto-detects Next.js

### NestJS

Build and start the API server independently:

```bash
cd apps/api
pnpm build
pnpm start:prod
```
