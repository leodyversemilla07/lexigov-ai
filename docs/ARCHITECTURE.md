# LexiGov AI — System Architecture Specification

## 1. System Overview

**LexiGov AI** is an AI-assisted legislative drafting and compliance governance SaaS platform engineered specifically for Philippine Local Government Units (LGUs). It ensures all drafted Ordinances, Resolutions, Memorandums, and Policies strictly adhere to **Republic Act No. 7160 (The Local Government Code of 1991)** and related administrative issuances (DILG, Supreme Court jurisprudence).

---

## 2. Architectural Pillars & Decisions

### 2.1 Full-Stack Topology & Distributed Auth Caching
- **Frontend**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19) with Tailwind CSS v4, shadcn/ui primitives (`@lexigov/ui`), and shared business logic (`@lexigov/shared`).
- **Backend API**: [NestJS 11](https://nestjs.com) REST and Server-Sent Events (SSE) microservices.
- **Authentication**: [Better Auth](https://better-auth.com) with 2FA TOTP and Organization plugin on Next.js.
- **Session Caching**: NestJS `AuthGuard` queries Redis for active session tokens (`session:<token>`) with a 5-minute sliding TTL before falling back to PostgreSQL, drastically mitigating DB IOPS under streaming AI generation.

### 2.2 LGU Multi-Tenancy & Sanggunian RBAC
- **Tenant Model**: Drafts and templates are scoped to `organizationId` representing an LGU / Sanggunian body (Barangay, Municipality, City, Province).
- **Legislative Roles**:
  - `admin`: LGU IT / System administrator.
  - `presiding_officer`: Vice Mayor / Vice Governor (signs enactments, committee referrals).
  - `sanggunian_secretary`: Manages journal, numbering, and transmittals.
  - `committee_chair`: Reviews and amends committee drafts.
  - `legislative_staff`: Creates and edits drafts.
  - `citizen_viewer`: Read-only access to published legislation.

### 2.3 Hybrid AI & Legal Intelligence Engine
- **Deterministic Bounds**: Real-time statutory limit enforcement in `@lexigov/shared` (e.g. strict penalty ceilings under RA 7160 § 516: Barangay ₱1,000 max, Municipal ₱2,500 max / 6 mos, City/Province ₱5,000 max / 1 yr).
- **Statutory Retrieval (RAG)**: `pgvector` index over RA 7160 provisions, DILG Memorandum Circulars, and historical LGU enactments to ground generation prompts.
- **LLM Synthesis**: [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) (GPT-4o) for high-precision section assistance, executive summaries, and legal drafting with streaming token SSE.

### 2.4 Document Editing, Concurrency & Versioning
- **Optimistic Concurrency Control (OCC)**: Version-gated updates prevent silent overwrites; conflicts trigger visual side-by-side diff resolution.
- **Presence Tracking**: Ephemeral Redis presence keys track active editors across sections.
- **Immutable Revision Snapshots**: Substantive updates store immutable revision trees in PostgreSQL with audit log tracking.

### 2.5 RA 7160 Legislative Workflow State Machine
Formal 8-stage statutory lifecycle:
`DRAFTING` → `FIRST_READING` → `COMMITTEE_REVIEW` → `SECOND_READING` → `THIRD_READING` → `SANGGUNIAN_ENACTED` → `LCE_REVIEW` (Mayor/Governor Approval or Veto) → `HIGHER_SANGGUNIAN_REVIEW` (Validity Review under RA 7160 § 56) → `ENACTED_PUBLISHED`.

### 2.6 Export, Tamper-Evidence & Verification
- **Artifact Storage**: Rendered PDF and DOCX documents stored in S3/Azure Blob Storage with official Republic letterheads and seals.
- **Cryptographic Verification**: `SHA-256` content hashing embedded in QR codes linking to `/verify/:id` for public authentication.

---

## 3. Tech Stack Matrix

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 16 (App Router, Turbopack) |
| UI & Styling | Tailwind CSS v4, Radix UI, `@lexigov/ui` (shadcn/ui) |
| Backend Framework | NestJS 11 |
| Database & ORM | PostgreSQL + `pgvector` with Prisma ORM |
| In-Memory Cache | Redis |
| Authentication | Better Auth (with Prisma Adapter & Organization plugin) |
| AI / LLM | Azure OpenAI Service (GPT-4o) via `openai` SDK |
| Storage & CDN | AWS S3 / Azure Blob Storage + CloudFront/CDN |
| Monorepo Tooling | Turborepo + pnpm workspaces |
