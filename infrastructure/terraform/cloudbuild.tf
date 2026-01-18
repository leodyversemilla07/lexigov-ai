/**
 * Cloud Build Triggers
 */

resource "google_cloudbuild_trigger" "web" "frontend" {
  name     = "lexigov-web-deploy"
  description = "Deploy frontend on every commit to main"
  
  github {
    owner = "your-org"
    name   = "lexigov-ai"
    branch = "main"
    name {
      # Build and deploy
      deploy_gh_actions = "lexigov-web-deploy"
    }
  }

  included_files = [
    "apps/web/**"
  ]
  
  ignored_files = [
    "**/node_modules/**"
    "**/.next/**"
    "**/out/**"
  ]
  
  build_configurations = {
    "production" {
      entry_point       = "gcr.io/cloud-builders/apps-web"
    substitutions = {
      "_REGION"           = "asia-southeast2"
      "_SERVICE"          = "asia-southeast2"
    }
    }
  }

  depends_on = [google_project_service.default]
}

resource "google_cloudbuild_trigger" "api" "backend" {
  name     = "lexigov-api-deploy"
  description = "Deploy backend on every commit to main"
  
  github {
    owner = "your-org"
    name   = "lexigov-ai"
    branch = "main"
    name {
      # Build and deploy
      deploy_gh_actions = "lexigov-api-deploy"
    }
  }

  included_files = [
    "apps/api/**"
  ]
  
  ignored_files = [
    "**/node_modules/**"
  ]
  
  build_configurations = {
    "production" {
      entry_point       = "gcr.io/cloud-builders/nodejs"
      substitutions = {
        "_REGION"           = "asia-southeast2"
        "_SERVICE"          = "asia-southeast2"
      }
    }
  }

  depends_on = [google_project_service.default]
}
