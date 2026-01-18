/**
 * Cloud Build Configuration for LexiGov AI
 * This file defines the build triggers for frontend and backend deployments
 */

module "cloud-build" {
  project = "lexigov-ai"
  region = "asia-southeast2"
  regions = ["asia-southeast1", "asia-northeast1", "asia-southeast2"]
}

provider "github" {
  owner = "your-org"
  repo = "lexigov-ai"
  branch = "main"
}

steps {
  name = "Build and Deploy LexiGov AI"
  env = {
    GCP_PROJECT_ID = "lexigov-ai-dev"
    GCP_REGION = "asia-southeast2"
    GCP_ZONE = "asia-southeast2-a"
    DOMAIN_NAME = "lexigov-ai.com"
    WEB_HOST = "web.lexigov-ai.com"
    API_HOST = "api.lexigov-ai.com"
    
    # Cloud Armor configuration
    ARMOR_WAF_ENABLED = "true"
    ARMOR_MODE = "standard"
    
    # Build configurations
    WEB_BUILD_IMAGE = "gcr.io/${var.owner}/${var.project}/${var.repo}:${var.github_sha}"
    API_BUILD_IMAGE = "gcr.io/${var.owner}/${var.project}/${var.repo}:${var.github_sha}"
    
    # Deployment settings
    WEB_DEPLOY_REGION = "asia-southeast2"
    API_DEPLOY_REGION = "asia-southeast2"
  }
  
  build {
    # Install dependencies
    - name: "Install dependencies"
      run = "cd web && pnpm install --frozen-lockfile"
      timeout = "600s"
    
    # Run linting
    - name: "Lint and format"
      run: |
        cd web && pnpm run lint &&
        pnpm run format
      timeout = "300s"
    
    # Run type check
    - name: "Type check"
      run: "cd web && pnpm run type-check"
      timeout = "120s"
    
    # Build application
    - name: "Build Next.js"
      run: "cd web && pnpm build"
      timeout = "600s"
    
    # Deploy to production
    - name: "Deploy frontend to production"
      run: |
        cd web &&
        npx gcloud app deploy lexigov-web \
          --project=${GCP_PROJECT_ID} \
          --region=${WEB_DEPLOY_REGION} \
          --platform=managed \
          --quiet
      timeout = "300s"
  }
  
  postbuild {
    # Image tagging
    - name: "Tag and push images"
      run: |
        IMAGE_TAG=$(git rev-parse HEAD --short)
        echo "Tagging images as ${IMAGE_TAG}"
        gcloud container tags add gcr.io/${var.owner}/${var.project} web:${IMAGE_TAG}
        gcloud container tags add gcr.io/${var.owner}/${var.project} api:${IMAGE_TAG}
        echo "Images tagged successfully"
      timeout = "120s"
    
    # Build notifications
    - name: "Notify Slack on deployment"
      run: |
        echo "Frontend deployed to production: ${IMAGE_TAG}" |
        # curl -X POST -H 'Content-Type: application/json' -d '{"text":"Frontend deployed successfully"}' https://hooks.slack.com/services/YOUR_WEBHOOK_URL
      timeout: "30s"
  }
}

# Backend build configuration (similar structure)
steps {
  name = "Build and Deploy Backend API"
  env = {
    GCP_PROJECT_ID = "lexigov-ai-dev"
    GCP_REGION = "asia-southeast2"
    GCP_ZONE = "asia-southeast2-a"
    DOMAIN_NAME = "lexigov-ai.com"
    API_HOST = "api.lexigov-ai.com"
  }
  
  build {
    # Install dependencies
    - name: "Install API dependencies"
      run: "cd api && pnpm install --frozen-lockfile"
      timeout = "600s"
    
    # Run linting
    - name: "Lint and format API"
      run: |
        cd api && pnpm run lint &&
        pnpm run format
      timeout: "300s"
    
    # Type check
    - name: "Type check"
      run: "cd api && pnpm run type-check"
      timeout: "120s"
    
    # Build application
    - name: "Build Fastify"
      run: "cd api && pnpm build"
      timeout = "600s"
    
    # Deploy to production
    - name: "Deploy backend API to production"
      run: |
        cd api &&
        npx gcloud app deploy lexigov-api \
          --project=${GCP_PROJECT_ID} \
          --region=${API_DEPLOY_REGION} \
          --platform=managed \
          --quiet
      timeout: "300s"
  }
}

module "post-destinations" {
  // Slack notification destinations
  slack {
    type = "slack"
    webhook_url = "${env.SLACK_WEBHOOK_URL}"
    channels {
      deployments = "#deployments"
      notifications = "#notifications"
    }
  }
  
  // Build notifications
  deployments {
    channels = ["#deployments"]
    on_failure {
      condition = "*"
      steps = [
        { name: "Send failure notification", webhook: "slack", channel: "notifications" }
      ]
    }
    on_success {
      condition = "*"
      steps = [
        { name: "Send success notification", webhook: "slack", channel: "notifications" }
      ]
    }
  }
}
