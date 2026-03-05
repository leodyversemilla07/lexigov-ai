# LexiGov AI

An AI-powered platform for drafting **RA 7160-compliant** local government ordinances for Philippine Local Government Units (LGUs).

---

## Overview

LexiGov AI streamlines the ordinance creation process by combining Google Gemini AI with a structured document workflow. It supports multiple jurisdiction levels (Barangay, City, Municipal, Provincial) and document types (Ordinance, Resolution, Memorandum, Policy), with built-in RA 7160 compliance checking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript |
| Auth | [Clerk](https://clerk.com) |
| Database / Backend | [Convex](https://convex.dev) (real-time, serverless) |
| AI | [Google Gemini 1.5 Flash](https://ai.google.dev) via `@google/generative-ai` |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Forms | React Hook Form + Zod |
| Fonts | [Geist](https://vercel.com/font) (local, via `geist` npm package) |

---

## Features

- **AI Ordinance Generation** — Generate complete, professionally formatted ordinances from a plain-language prompt using Google Gemini AI
- **RA 7160 Compliance Checking** — Automated compliance scoring against the Local Government Code of 1991
- **Draft Management** — Full CRUD with versioning, commit messages, and status workflow (Draft → Review → Final → Archived)
- **Template Library** — Reusable ordinance templates by category and jurisdiction level, with public sharing
- **Document Comparison** — Side-by-side diff of draft versions
- **Export** — Export drafts to PDF and DOCX
- **Role-Based Access** — Roles: Admin, Legislative Staff, Barangay Secretary, City Council, Researcher
- **Collapsible Sidebar** — shadcn sidebar-07 with collapse-to-icons navigation

---

## Project Structure

```
app/
├── (auth)/          # Clerk sign-in and sign-up pages
├── dashboard/       # Protected dashboard routes
│   ├── compare/     # Document comparison
│   ├── compliance/  # RA 7160 compliance reports
│   ├── drafts/      # Draft list, editor, new draft
│   ├── export/      # Export to PDF/DOCX
│   ├── settings/    # User settings
│   └── templates/   # Template library
components/
├── app-sidebar.tsx  # LexiGov navigation sidebar
├── header.tsx       # Top header with search and user menu
├── nav-main.tsx     # Flat nav links with active-route detection
└── ui/              # shadcn/ui primitives
convex/
├── schema.ts        # Database schema (users, drafts, templates, complianceReports)
├── drafts.ts        # Draft queries and mutations
├── templates.ts     # Template queries and mutations
├── ai.ts            # Gemini AI action
└── users.ts         # User sync with Clerk
lib/
└── schemas/         # Shared Zod schemas (enums, draft, template, auth, ai)
hooks/               # Custom React hooks
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Clerk](https://clerk.com) account
- A [Convex](https://convex.dev) account
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

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

# Google Gemini AI
GEMINI_API_KEY=AI...
```

### Run the Development Server

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Convex backend
npx convex dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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
