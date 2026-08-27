# Firebase & Google Cloud Setup Guide

> Archived legacy document. Firebase is no longer part of the running app.
> The current implementation uses Clerk for authentication and Convex for backend state.

This guide walks you through setting up Firebase Authentication and Google Cloud Vertex AI for LexiGov AI.

## Prerequisites

1. **Google Cloud Account**: Create a GCP account at [console.cloud.google.com](https://console.cloud.google.com)
2. **Project Creation**: Create a new GCP project or select an existing one
3. **Billing**: Enable billing for the GCP project

## Part 1: Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `lexigov-ai-prod` (or `lexigov-ai-dev` for development)
4. Select region: `asia-southeast1` (Singapore) - closest to Philippines
5. Enable **Cloud Firestore** database
6. Enable **Cloud Storage** for file uploads
7. Click **"Create project"**

### Step 2: Get Firebase Configuration Keys

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your Apps** section
3. Copy the **Firebase configuration** (it looks like code: `# Firebase config section`)

Add these values to your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

**Important Notes:**
- Never commit `.env.local` or `.env` files with real credentials
- Use `.env.local` for local development
- Use deployment environment variables for production
- Do not share your Firebase config with anyone

## Part 2: Google Cloud Platform Setup

### Step 1: Enable Vertex AI API

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Select your project (create new one if needed)
3. Navigate to **APIs & Services > Vertex AI**
4. Click **"Enable"** on Vertex AI API

### Step 2: Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **"Create Service Account"**
3. Service account name: `lexigov-ai-vertex`
4. Grant role: `Vertex AI User` (or `Vertex AI Administrator`)
5. Download the JSON key file when prompted

### Step 3: Get Credentials

The downloaded JSON file contains:
- `client_email`
- `private_key`
- `project_id`

**Important**: Store this JSON file securely. Never commit it to version control.

Add these to your `.env.local` file:

```bash
# Google Cloud Platform (GCP) - Vertex AI
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
GOOGLE_CLOUD_LOCATION=asia-southeast2
GOOGLE_CLOUD_VERTEX_AI_ENDPOINT=https://asia-southeast2-aiplatform.googleapis.com

# Service Account (keep file path relative, will be used in backend)
GOOGLE_CLOUD_CREDENTIALS_PATH=credentials.json
```

## Part 3: Environment Variables Reference

Copy these to your `.env.local` file and fill in your actual values:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lexigov

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Firebase (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

# GCP Vertex AI (from GCP Console)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_LOCATION=asia-southeast2
GOOGLE_CLOUD_VERTEX_AI_ENDPOINT=

# Application
NODE_ENV=development
LOG_LEVEL=info

# JWT (for backend auth - generate secure secret in production)
JWT_SECRET=
```

## Part 4: Backend Integration Notes

### Firebase Admin SDK

The backend already has Firebase Admin SDK installed. When you have your credentials, you'll need to:

1. Create a service account for Firebase Admin SDK
2. Download the service account JSON key
3. Update backend authentication to use Firebase Admin for token verification
4. Implement ID token exchange between Firebase Client and Admin SDK

### Vertex AI Integration

To integrate Vertex AI in the backend (`apps/api/`):

1. Install dependencies:
   ```bash
   cd apps/api
   pnpm add @google-cloud/vertexai
   ```

2. Create Vertex AI service client:
   ```typescript
   // apps/api/src/services/vertex.ts
   import { VertexAI } from '@google-cloud/vertexai';
   
   const vertexAI = new VertexAI({
     project: process.env.GOOGLE_CLOUD_PROJECT_ID,
     location: process.env.GOOGLE_CLOUD_LOCATION || 'asia-southeast2',
   });
   ```

3. Create ordinance generation endpoint:
   ```typescript
   // apps/api/src/routes/ai.ts
   fastify.post('/ai/generate', async (request, reply) => {
     const { prompt, jurisdiction, documentType } = request.body;
     
     // Call Vertex AI to generate ordinance
     const response = await vertexAI.prediction({
       endpoint: `publishers/google/models/gemini-1.5-pro`,
       instances: [
         {
           prompt: `Generate an ordinance for ${jurisdiction}`,
           }
       ],
     });
     
     return reply.send({ ordinance: response.text });
   });
   ```

## Part 5: Firebase Authentication Flow

### Client-Side (Frontend)

The frontend (`apps/web/`) uses Firebase Client SDK (`firebase` v12+).

**Authentication Flow:**
1. User clicks "Sign In" → Redirect to `/api/auth/login` (backend)
2. Backend validates credentials with Firebase Auth
3. Backend generates custom token or uses Firebase Admin SDK
4. Backend returns JWT token
5. Frontend stores token and user session

**Current Implementation:**
- `packages/ui/src/auth/context.tsx` - Provides `AuthProvider`, `useAuth()`, `login()`, `register()`, `logout()`
- Uses Firebase Client SDK directly
- Handles auth state management
- Compatible with Firebase v12+

### Backend-Side (API)

The backend (`apps/api/`) already has Firebase integration:

**Current Implementation:**
- `apps/api/src/routes/auth.ts` - Firebase Auth endpoints
- Uses Firebase Admin SDK for server-side auth
- Validates Firebase tokens
- Creates/updates users in database

## Part 6: Security Best Practices

### Firebase Security

1. **Never commit credentials**: Never commit `.env.local`, `.env`, or any Firebase service account JSON files
2. **Use environment variables**: Always use environment variables for sensitive data
3. **Restrict API keys**: Use Firebase Security Rules to restrict access
4. **Anonymous users**: Configure authentication rules to prevent unauthorized access

### GCP Security

1. **Service Account Permissions**: Follow principle of least privilege
2. **IAM Roles**: Create custom roles for specific operations (e.g., Vertex AI User)
3. **API Key Rotation**: Rotate service account keys regularly
4. **Audit Logs**: Enable Cloud Audit Logs for sensitive operations

## Part 7: Testing

### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your local database URL and Firebase credentials
3. Run `pnpm dev` to test authentication flow

### Testing Checklist

- [ ] Firebase authentication works (sign in, sign out)
- [ ] Firebase Auth tokens are properly exchanged
- [ ] Vertex AI API is accessible
- [ ] Ordinance generation works with AI
- [ ] Frontend can call backend APIs successfully
- [ ] Database operations work correctly

## Part 8: Next Steps After Setup

1. **Configure Firebase Auth Rules**: Set up database rules and authentication rules
2. **Implement Vertex AI Integration**: Add ordinance generation endpoint
3. **Test Full Flow**: End-to-end testing of auth + AI generation
4. **Deploy to GCP**: Prepare Cloud Run deployment configuration
5. **Documentation**: Update README with production setup instructions

## Troubleshooting

### Common Issues

1. **Firebase Auth Error**: "Auth project not found"
   - Solution: Verify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your Firebase project ID

2. **GCP API Error**: "Permission denied"
   - Solution: Check service account has Vertex AI permissions

3. **CORS Error**: "CORS policy blocked"
   - Solution: Update backend CORS settings in `apps/api/src/server.ts`

4. **Database Connection Error**: "Connection refused"
   - Solution: Verify PostgreSQL is running and DATABASE_URL is correct

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [GCP Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring-environment-variables)
- [Prisma Documentation](https://www.prisma.io/docs)

## Support

For issues with Firebase or GCP setup, consult:
- Firebase Community: https://firebase.community
- Google Cloud Support: https://cloud.google.com/support
> Archived legacy document: Firebase setup is no longer part of the running app. The current implementation uses Clerk for authentication and Convex for backend state.
