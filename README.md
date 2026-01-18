# LexiGov AI - AI Ordinance & Policy Drafting Assistant

An AI-powered platform for drafting, reviewing, and refining ordinances and policies for Philippine Local Government Units (LGUs).

## 🎯 Project Overview

LexiGov AI helps local governments streamline legislative drafting through:
- **AI-Powered Generation**: Create ordinance drafts in seconds using Google Gemini AI
- **Philippine Compliance**: Built for RA 7160 (Local Government Code of 1991)
- **Real-Time Collaboration**: Multi-user document editing with Yjs CRDTs
- **Template Library**: Pre-built ordinance templates for common use cases
- **Smart Validation**: AI compliance checker with legal reference suggestions

## 🏗️ Architecture

```
LexiGov AI
├── apps/
│   ├── web/          # Next.js 14 frontend (React 19)
│   └── api/          # Fastify backend (Node.js 20)
├── packages/
│   ├── db/           # Prisma schema and migrations
│   ├── ui/           # Shared UI components (shadcn/ui)
│   ├── config/        # Shared configurations
│   └── types/        # TypeScript type definitions
└── infrastructure/    # Terraform GCP configurations
```

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.x
- **UI**: React 19 + shadcn/ui
- **Styling**: Tailwind CSS 3.x
- **Editor**: TipTap + Yjs (real-time collaboration)
- **Forms**: React Hook Form + Zod
- **Auth**: Firebase Authentication

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify 4.x
- **Database**: PostgreSQL 15+ (Cloud SQL)
- **ORM**: Prisma 5.x
- **Caching**: Redis 7.0 (Cloud Memorystore)
- **Queue**: BullMQ 5.x

### AI & ML
- **Engine**: Google Vertex AI
- **Models**: Gemini 1.5 Pro/Flash
- **SDK**: Vercel AI SDK compatible interface

### Infrastructure
- **Platform**: Google Cloud Platform (GCP)
- **Compute**: Cloud Run (serverless containers)
- **Database**: Cloud SQL PostgreSQL
- **Storage**: Cloud Storage
- **CI/CD**: Cloud Build + Cloud Deploy
- **IaC**: Terraform 1.x

## 📋 Features

### MVP (Phase 1-2)

#### Core Features
- ✅ AI Ordinance Draft Generator
- ✅ Document Editor (TipTap)
- ✅ Real-Time Collaboration
- ✅ Template System (6 categories)
- ✅ PDF/DOCX Export
- ✅ User Management
- ✅ Basic Dashboard

### Enhanced (Phase 3)

#### Advanced Features
- ✅ AI Compliance Checker
- ✅ Version Control System
- ✅ Executive Summary Generator
- ✅ Legal Reference Matching
- ✅ Due Process Validation

## 🏁 Development Progress

### Phase 1: Foundation (Weeks 1-4)
- [x] Project structure setup
- [x] Monorepo configuration
- [ ] Database schema design
- [ ] Backend initialization
- [ ] CI/CD pipeline setup

### Phase 2: Core Features (Weeks 5-10)
- [ ] AI ordinance generator
- [ ] Document editor
- [ ] Template system
- [ ] Export functionality
- [ ] Real-time collaboration

### Phase 3: Advanced Features (Weeks 11-16)
- [ ] Compliance checker
- [ ] Version control
- [ ] Summary generator

### Phase 4: Testing & QA (Weeks 17-18)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests

### Phase 5: Deployment (Weeks 19-20)
- [ ] Production deployment
- [ ] Go-live
- [ ] Post-launch monitoring

## 🚦 Getting Started

### Prerequisites

```bash
- Node.js 20+ LTS
- pnpm 8+
- Docker Desktop
- PostgreSQL 15+ (local) or Cloud SQL (GCP)
- Redis 7+ (local) or Cloud Memorystore (GCP)
- Google Cloud SDK (for deployment)
```

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/lexigov-ai.git
cd lexigov-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lexigov"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# GCP
GCP_PROJECT_ID="your-project-id"
GCP_REGION="asia-southeast2"

# AI
OPENAI_API_KEY="your-openai-key"  # Optional
GCP_VERTEX_AI_ENABLED="true"

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"

# Authentication
JWT_SECRET="your-jwt-secret"
```

## 📊 Project Structure

```
lexigov-ai/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/
│   │   │   ├── lib/       # Utility functions
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── types/     # TypeScript types
│   │   │   └── styles/    # Global styles
│   │   ├── public/     # Static assets
│   │   └── package.json
│   │
│   └── api/                 # Fastify backend
│       ├── src/
│       │   ├── routes/    # API endpoints
│       │   ├── services/   # Business logic
│       │   ├── plugins/    # Fastify plugins
│       │   ├── utils/      # Backend utilities
│       │   └── types/      # Backend types
│       ├── prisma/           # Database schema
│       └── package.json
│
├── packages/
│   ├── db/               # Shared database package
│   ├── ui/               # Shared UI components
│   ├── config/            # Shared configurations
│   └── types/            # Shared TypeScript types
│
├── infrastructure/           # GCP Terraform configs
│   ├── terraform/
│   └── docker-compose.yml
│
├── docs/                   # Documentation
├── scripts/                 # Utility scripts
├── package.json            # Root package.json
├── turbo.json             # Turborepo config
└── .gitignore
```

## 🧪 Development

### Run Development

```bash
# Start all services
pnpm dev

# Start frontend only
pnpm --filter @lexigov/web dev

# Start backend only
pnpm --filter @lexigov/api dev

# Database operations
pnpm db:studio           # Open Prisma Studio
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed database
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e

# Generate coverage
pnpm test:coverage
```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## 🔒 Security

### Authentication
- Firebase Authentication for user management
- Role-based access control (Admin, Staff, User)
- JWT tokens for API authorization

### Data Protection
- Encryption at rest (GCP Cloud SQL)
- Encryption in transit (TLS/SSL)
- Secret Manager for credentials
- Audit logging for all actions

### GCP Security
- Cloud Armor WAF rules
- IAM roles and permissions
- VPC network isolation
- DDoS protection

## 📈 Performance Targets

| Metric | Target | Status |
|---------|--------|--------|
| API Response Time | <500ms | TBD |
| Page Load Time | <2s | TBD |
| AI Generation Time | <10s | TBD |
| Uptime | >99.9% | TBD |
| Database Query Time | <100ms | TBD |

## 📝 Documentation

- [API Documentation](./docs/api.md)
- [Architecture](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./docs/contributing.md)

## 🤝 Contributing

Please read our [Contributing Guide](./docs/contributing.md) before submitting PRs.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

## 👥 Team

- Project Manager: TBD
- Tech Lead: TBD
- Development Team: TBD

## 📞 Contact

- Email: contact@lexigov.ai
- Website: https://lexigov.ai (coming soon)

---

**Built for Philippine LGUs by the LexiGov Team 🇵🇭**
