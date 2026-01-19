# LexiGov AI - API Service

Backend API for Philippine ordinance generation and management using Google Gemini API.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### AI Generation (Gemini API)

#### 1. Generate Ordinance
```
POST /api/ai/generate
```

**Request Body:**
```json
{
  "topic": "Anti-Littering Ordinance",
  "ordinanceType": "barangay",
  "jurisdiction": {
    "name": "Barangay San Isidro",
    "province": "Bulacan",
    "city": "San Jose del Monte City"
  },
  "problemStatement": "Increasing littering causing health and environmental concerns",
  "objectives": [
    "Reduce littering in public spaces",
    "Promote proper waste disposal"
  ],
  "targetPopulation": "All residents and visitors",
  "prohibitedActs": [
    "Throwing garbage in public places",
    "Littering from vehicles"
  ],
  "enforcementBody": "Barangay Tanod",
  "penalties": {
    "firstOffense": "Fine of ₱500",
    "secondOffense": "Fine of ₱800",
    "thirdOffense": "Fine of ₱1,000"
  },
  "useProModel": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ordinance": {
      "metadata": { ... },
      "header": { ... },
      "preamble": { ... },
      "body": { ... },
      "finalProvisions": { ... },
      "compliance": { ... }
    },
    "metadata": {
      "generatedAt": "2026-01-19T08:57:31.000Z",
      "model": "gemini-2.0-flash",
      "tokens": {
        "input": 1000,
        "output": 3500,
        "total": 4500
      }
    },
    "message": "Ordinance generated successfully"
  }
}
```

#### 2. Check Compliance
```
POST /api/ai/check-compliance
```

**Request Body:**
```json
{
  "ordinance": {
    "metadata": { ... },
    "header": { ... },
    // ... complete ordinance object
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "compliance": {
      "overallScore": 95,
      "isValid": true,
      "issuesCount": 0,
      "warningsCount": 2,
      "suggestionsCount": 3,
      "issues": [
        {
          "type": "warning",
          "section": 4,
          "title": "Passive voice detected",
          "description": "Section 4 uses passive voice construction",
          "suggestion": "Rewrite in active voice for clarity",
          "legalReference": "Legal drafting standards"
        }
      ],
      "checkedAt": "2026-01-19T08:57:31.000Z"
    },
    "message": "Ordinance is compliant with RA 7160"
  }
}
```

#### 3. Generate Executive Summary
```
POST /api/ai/executive-summary
```

**Request Body:**
```json
{
  "ordinance": {
    // ... complete ordinance object
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "This ordinance addresses the growing concern of littering...",
    "message": "Executive summary generated successfully"
  }
}
```

#### 4. Suggest Legal References
```
POST /api/ai/suggest-references
```

**Request Body:**
```json
{
  "content": "This ordinance aims to regulate tricycle operations...",
  "jurisdiction": "barangay"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "references": [
      "Section 16, RA 7160 (General Welfare Clause)",
      "Section 389, RA 7160 (Powers of Sangguniang Barangay)"
    ],
    "count": 2,
    "message": "Legal references suggested successfully"
  }
}
```

## 🔧 Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lexigov_db"

# Google AI Studio (Gemini)
GEMINI_API_KEY="AIzaSy..."

# Legacy Vertex AI Config (Optional/Deprecated)
# GOOGLE_APPLICATION_CREDENTIALS="..."
# GCP_PROJECT_ID="..."
# GCP_REGION="..."

# CORS
CORS_ORIGIN="http://localhost:3000"
```

## 🏗️ Project Structure

```
apps/api/
├── src/
│   ├── index.ts              # Application entry point
│   ├── routes/
│   │   ├── index.ts          # Route aggregator
│   │   ├── ai.ts             # AI/Gemini endpoints ⭐️
│   │   ├── auth.ts           # Authentication
│   │   ├── drafts.ts         # Draft management
│   │   ├── templates.ts      # Template management
│   │   ├── compliance.ts     # Compliance reports
│   │   └── exports.ts        # PDF/DOCX exports
│   ├── services/
│   │   └── gemini.ts         # Gemini AI service ⭐️
│   ├── middleware/
│   │   └── auth.ts           # Auth middleware
│   ├── plugins/
│   │   └── firebase.ts       # Firebase plugin
│   └── utils/
│       ├── auth.ts           # Auth utilities
│       └── response.ts       # Response helpers
├── package.json
└── tsconfig.json
```

## 🧪 Testing with cURL

### Generate an Ordinance

```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "topic": "Anti-Noise Pollution Ordinance",
    "ordinanceType": "barangay",
    "jurisdiction": {
      "name": "Barangay Test",
      "province": "Metro Manila",
      "city": "Quezon City"
    },
    "problemStatement": "Excessive noise from events disturbing residents",
    "objectives": ["Reduce noise pollution", "Protect resident peace"],
    "targetPopulation": "All residents",
    "prohibitedActs": ["Operating loud equipment after 10 PM"],
    "enforcementBody": "Barangay Peacekeeping Force"
  }'
```

### Check Compliance

```bash
curl -X POST http://localhost:3001/api/ai/check-compliance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @ordinance.json
```

## 📊 Gemini Models

| Model | Endpoint | Use Case | Speed |
|-------|----------|----------|-------|
| **Gemini 2.0 Flash** | `/ai/generate` | Ordinance generation | Fast |
| **Gemini 2.5 Pro** | `/ai/check-compliance` | Legal analysis | Slower |

Switch models using `useProModel: true` in generate endpoint.

## 🔒 Authentication

All endpoints require Firebase Authentication. Include JWT token in Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## 📖 Documentation

- [AI Setup Guide](../../docs/AI_SETUP_GUIDE.md) - Complete setup documentation
- [API Routes](./src/routes/ai.ts) - API implementation
- [Gemini Service](./src/services/gemini.ts) - Core AI service

## 🐛 Troubleshooting

### Development Mode Without API Key

The service automatically uses **mock data** when:
- `NODE_ENV=development`
- No `GEMINI_API_KEY` configured

This allows local development without an API key.

### Enable Real Gemini AI

1. Get an API Key from Google AI Studio
2. Set `GEMINI_API_KEY` in `.env`

## 🚀 Performance

- **Ordinance Generation**: ~8-10 seconds
- **Compliance Check**: ~5-8 seconds
- **Executive Summary**: ~3-5 seconds
- **Legal References**: ~2-3 seconds

---

**Built with ❤️ for Philippine LGUs**
