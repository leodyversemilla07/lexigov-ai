# LexiGov AI - Project Structure Reference

> Archived legacy document. This file describes an older Prisma/Firebase-era structure and is not the source of truth for the running app.
> Use `README.md` plus the current Clerk + Convex codebase instead.

## Complete File Tree

```
lexigov-ai/
├── apps/                                    # Applications
│   ├── web/                                # Next.js Frontend (React 19, TS 5.x)
│   │   ├── src/
│   │   │   ├── app/                    # App Router Pages
│   │   │   │   ├── layout.tsx      # Root layout
│   │   │   │   ├── page.tsx        # Home/Landing page
│   │   │   │   └── globals.css     # Global styles
│   │   │   ├── components/             # React Components
│   │   │   ├── lib/                 # Utility functions
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── types/                # Type definitions
│   │   │   └── styles/               # CSS modules
│   │   ├── public/                       # Static assets
│   │   ├── package.json                  # Dependencies
│   │   ├── next.config.ts             # Next.js config
│   │   ├── tsconfig.json              # TS config
│   │   └── tailwind.config.js         # Tailwind config
│   │
│   └── api/                                 # Fastify Backend (Node.js 20, TS 5.x)
│       ├── src/
│       │   ├── routes/                 # API Routes
│       │   │   ├── index.ts          # Main routes
│       │   │   └── health.ts          # Health endpoints
│       │   ├── services/                # Business logic
│       │   ├── utils/                  # Utilities
│       │   │   ├── response.ts       # API response formatting
│       │   │   └── auth.ts          # Auth middleware
│       │   └── types/                  # Backend types
│       ├── prisma/                       # Database Schema
│       │   ├── schema.prisma          # Prisma schema
│       │   └── package.json            # DB dependencies
│       ├── src/
│       │   ├── plugins/               # Fastify plugins
│       │   ├── server.ts               # App server entry
│       │   ├── types.ts                # Backend types
│       │   └── tsconfig.json            # TS config
│
├── packages/                                # Shared Packages
│   ├── types/                            # TypeScript Types
│   │   ├── src/index.ts             # Philippine Ordinance Types
│   │   └── package.json              # Types dependencies
│   │
│   ├── db/                               # Database Package
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Prisma Schema
│   │   │   └── package.json            # DB dependencies
│   │   └── src/
│   │       ├── index.ts             # Prisma client
│   │       ├── prisma.ts           # Prisma wrapper
│   │       └── package.json            # DB dependencies
│   │
│   ├── ui/                               # UI Components (NOT STARTED)
│   ├── config/                            # Shared Config (NOT STARTED)
│   └── tsconfig/                       # Shared TS configs (NOT STARTED)
│   │
│   └── tsconfig.json                    # Shared TS config (NOT STARTED)
│
├── infrastructure/                            # GCP Infrastructure (NOT STARTED)
│   ├── terraform/                         # Terraform configs (NOT STARTED)
│
├── docs/                                   # Documentation (NOT STARTED)
├── scripts/                                # Utility Scripts (NOT STARTED)
│
├── package.json                              # Root Workspace Config
├── turbo.json                                # Turborepo Pipeline Config
├── .gitignore                              # Git Ignore Rules
├── .env.example                              # Environment Template
├── .eslintrc.json                            # ESLint Config
├── .prettierrc.json                         # Prettier Config
├── .prettierignore                            # Prettier Ignore Rules
├── README.md                                # Project Documentation
├── DEVELOPMENT.md                            # Development Progress
└── SUMMARY.md                               # Technical Summary
```

---

## File Purposes

### Root Configuration Files

| File | Purpose |
|-------|---------|
| `package.json` | Monorepo workspace configuration |
| `turbo.json` | Build pipeline configuration |
| `.gitignore` | Git ignore patterns |
| `.eslintrc.json` | ESLint rules |
| `.prettierrc.json` | Prettier formatting |
| `.env.example` | Environment variable template |

### Application Files

| File | Purpose |
|-------|---------|
| `apps/web/` | Next.js frontend application |
| `apps/api/` | Fastify backend API |

### Package Files

| Directory | Purpose |
|----------|---------|
| `packages/types/` | Shared TypeScript types |
| `packages/db/` | Database schema and Prisma client |
| `packages/ui/` | Shared UI components (not started) |
| `packages/config/` | Shared configurations (not started) |
| `packages/tsconfig/` | Shared TypeScript configs (not started) |

### Documentation Files

| File | Purpose |
|-------|---------|
| `README.md` | Project overview and setup guide |
| `DEVELOPMENT.md` | Live progress tracking |
| `SUMMARY.md` | Technical architecture documentation |

### Infrastructure Files

| File | Purpose |
|-------|---------|

---

## Technology Stack Reference

### Frontend Stack
- **Framework**: Next.js 14
- **Language**: TypeScript 5.x
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.x
- **State Management**: React Hook Form (not implemented)
- **Forms**: Zod (configured)
- **Editor**: TipTap (not implemented)
- **Auth**: NextAuth (not implemented)

### Backend Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify 4.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 15+ (Cloud SQL)
- **Logging**: Pino
- **Security**: Helmet.js, CORS, JWT
- **Validation**: Zod 3.22.4
- **API Version**: v1 with /api/v1 prefix

### Database
- **Schema**: Prisma with 7 models
- **Connection**: Singleton client wrapper
- **Models**: User, Draft, Template, AuditLog, VersionComparison, ExportHistory, ComplianceReport
- **Enums**: UserRole, DocumentType, DocumentStatus, JurisdictionLevel, AuditAction

- **Frontend**: Next.js dev server
- **Backend**: Fastify server on port 8080
- **Database**: PostgreSQL 15 on port 5432
- **Cache**: Redis 7 on port 6379

---

## Development Status

### Completed (90%)

#### Project Structure ✅
- [x] Monorepo with pnpm workspaces
- [x] Root configuration files
- [x] Package structure (types, db)
- [x] Application structure (web, api)

#### Database ✅
- [x] Prisma schema with 7 models
- [x] Philippine ordinance TypeScript types
- [x] Database client utilities
- [x] Connection wrapper

#### Frontend ✅
- [x] Next.js 14 configuration
- [x] TypeScript configuration
- [x] Tailwind CSS configuration
- [x] Root layout
- [x] Home page with hero section
- [x] Global styles

#### Backend ✅
- [x] Fastify 4.x package
- [x] TypeScript configuration
- [x] Fastify server with plugins
- [x] Health check endpoints
- [x] API response utilities
- [x] Authentication middleware
- [x] Route registration system

#### Infrastructure ✅
- [x] PostgreSQL service config
- [x] Redis service config

#### Documentation ✅
- [x] README.md (312 lines)
- [x] DEVELOPMENT.md (live progress)
- [x] SUMMARY.md (technical architecture)
- [x] .env.example

#### Linting & Formatting ✅
- [x] ESLint configuration
- [x] Prettier configuration
- [x] .prettierrc.json
- [x] .prettierignore

### Pending (10%)

#### Dependencies
- [ ] Run `pnpm install` (CRITICAL - blocks all development)

#### Backend Utilities (To Complete)
- [ ] Error handling middleware
- [ ] Request logging middleware
- [ ] Rate limiting middleware

#### API Routes (To Implement)
- [ ] User authentication endpoints
- [ ] Draft CRUD operations
- [ ] Template management endpoints
- [ ] Export generation endpoints
- [ ] AI generation endpoints

---

## Next Steps

### Immediate (Run `pnpm install` first)
1. Install all monorepo dependencies
2. Verify Prisma client generation
3. Test backend server startup
4. Test frontend dev server

### This Session Goals
- [x] Initialize `@lexigov/ui` workspace
- [ ] Implement Firebase Authentication
- [ ] Create basic UI layout with sidebar
- [ ] Start GCP infrastructure setup

### Week 2 Goals
- [ ] Create shared UI components
- [ ] Implement user management APIs
- [ ] Create draft CRUD operations
- [ ] Implement template management
- [ ] Set up database connections and migrations

---

**Project Status**: Foundation Complete - Ready for Dependency Installation  
**Next Session**: Week 2 - Backend Development

---

*Reference Document - Last Updated: January 17, 2026 at 8:15 PM PHT*
> Archived legacy document: this file describes an older Prisma/Firebase-era architecture and is not the source of truth for the current Clerk + Convex app. Use `README.md` and the live codebase instead.
