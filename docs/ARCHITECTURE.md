# LexiGov AI — Implemented Architecture

This document describes the code currently present in the repository. LexiGov is an AI-assisted drafting system; its automated checks and exports are **not legal certifications or authoritative government records**.

## Runtime topology

- `apps/web`: Next.js 16 / React 19 frontend and Better Auth handler.
- `apps/api`: NestJS 11 REST/SSE API.
- PostgreSQL with Prisma stores authentication records, organizations, drafts, revision snapshots, reports, exports, and audit events.
- `packages/shared`: schemas and deterministic drafting/workflow utilities.
- `packages/ai`: provider-neutral AI contracts and provider implementations.
- `packages/ui`: shared UI primitives.
- `packages/env`: environment validation.

Redis, pgvector/RAG, object storage, CDN publication, collaborative presence, and a public enactment registry are **not implemented**.

## Authentication and authorization

Better Auth runs in the web application with email/password, two-factor, organization, admin, and bearer plugins. The NestJS API accepts:

- a raw bearer session token for non-browser clients; or
- a Better Auth HMAC-signed session cookie.

The API validates sessions against PostgreSQL on every request so logout, suspension, and role changes take effect immediately. Cookie-authenticated mutations require a configured trusted `Origin`.

Personal drafts remain owner-scoped. Organization drafts are readable by persisted members, while the generic `member` role is deliberately read-only. Editing and compliance-report creation require an explicit legislative workspace role; deletion is limited to the draft owner or an organization administrator. Inaccessible resource IDs return a non-enumerating not-found response. The frontend’s active Better Auth organization scopes draft lists, selectors, dashboard counts, and newly created manual or AI drafts; users can create workspaces, accept emailed invitations, and manage members from Settings when Better Auth grants owner/admin permission. Legislative workflow permissions are derived from persisted user or membership roles; client role headers are not trusted, and workspace roles do not prove public office or legal authority.

## Draft integrity and versioning

Draft updates and restores use version-gated Prisma updates inside transactions. A stale write fails with HTTP 409. Before a substantive update, the prior state is stored as a read-only revision. Restoring a revision restores textual content but does not replay historical workflow approval state.

Structured section editing preserves text before the first formal `SECTION` heading, including headers and WHEREAS recitals.

## Legislative workflow

The implemented stages are:

`DRAFTING → FIRST_READING → COMMITTEE_REVIEW → SECOND_READING → THIRD_READING → TRANSMITTED_TO_LCE → ENACTED | VETOED`

Stages cannot be skipped through draft editing. Persisted roles control transitions and sensitive voting/executive-action fields. “Lapsed into law” is deliberately unavailable because it requires authoritative date and legal review data not maintained by the application.

## AI and compliance checks

Supported provider adapters include Azure OpenAI, OpenAI, Gemini, Anthropic, OpenAI-compatible services, and a development/test mock. Production startup does not silently fall back to mock AI. Provider responses for compliance augmentation are runtime-validated before they are merged with deterministic checks.

Compliance scores are advisory drafting signals. They cannot establish validity, enactment, publication, constitutionality, or RA 7160 compliance.

## Export and verification boundary

TXT, Markdown, DOCX, PDF, and print exports are generated locally or returned by the API. Every export is marked as a working draft. User-controlled print content is HTML-escaped and printed under a restrictive CSP.

The `/verify` page fails closed and explains that no authoritative registry exists. The shared package can calculate a SHA-256 content fingerprint for diagnostics, but a fingerprint is not a digital signature or proof of authenticity.

## Deployment

- Node.js 22 or later and pnpm 11 are required.
- Apply committed Prisma migrations before starting applications. The API container runs `prisma migrate deploy` before launching.
- Web and API must share `DATABASE_URL` and `BETTER_AUTH_SECRET`; Compose requires these values rather than supplying default credentials.
- Configure `CORS_ORIGIN` and Better Auth trusted origins explicitly in production.
- Configure a transactional email provider; console email and mock AI are rejected in production.
- Dockerfiles build the web and API applications independently from the workspace. Compose keeps PostgreSQL private, binds application ports to loopback, checks database/API/web readiness, and waits for healthy dependencies.
