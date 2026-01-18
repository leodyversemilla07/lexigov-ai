/**
 * Backend API Cloud Run Services
 */

/**
 * Frontend Cloud Run Service
 */
resource "google_cloud_run_v2_service" "web" "default" {
  name     = "lexigov-web"
  location = var.gcp_region
  template  = "asia-southeast2/cpus"

  containers {
    image = "asia-southeast2-docker.pkg.dev/${var.gcp_project_id}/lexigov/web:latest"
    
    ports {
      container_port = 3000
    }
    
    env_vars = {
      NODE_ENV           = "production"
      DATABASE_URL       = "postgresql://lexigov_user:password@${google_sql_database_instance.postgres.host}:5432/lexigov"
      REDIS_HOST        = var.redis_host
      REDIS_PORT        = var.redis_port
      REDIS_PASSWORD    = var.redis_password
      JWT_SECRET        = var.jwt_secret
      NEXT_PUBLIC_APP_URL = "https://web.${var.domain_name}"
    }

    resources {
      cpu    = "1000m"
      memory = "512Mi"
    }
    
    timeout_seconds = 300
    max_instance_count = 10
    min_instance_count = 0

    // Allow unauthenticated invocations for public health endpoint
    invader_health_check = true

    // Auto-scaling configuration
    autoscaling_policy {
      max_instances = 10
      min_instances = 0
      target_cpu_utilization = 60
      target_concurrency = 80
    }
  }

/**
 * Backend API Cloud Run Service
 */
resource "google_cloud_run_v2_service" "api" "default" {
  name     = "lexigov-api"
  location = var.gcp_region
  template = "asia-southeast2/cpu"

  containers {
    image = "asia-southeast2-docker.pkg.dev/${var.gcp_project_id}/lexigov/api:latest"
    
    ports {
      container_port = 8080
    }
    
    env_vars = {
      NODE_ENV           = "production"
      DATABASE_URL       = "postgresql://lexigov_user:password@${google_sql_database_instance.postgres.host}:5432/lexigov"
      REDIS_HOST        = var.redis_host
      REDIS_PORT        = var.redis_port
      REDIS_PASSWORD    = var.redis_password
      JWT_SECRET        = var.jwt_secret
      API_BASE_URL      = "https://api.${var.domain_name}"
      GCP_PROJECT_ID   = var.gcp_project_id
      GCP_REGION        = var.gcp_region
    }
    
    resources {
      cpu    = "1000m"
      memory = "1Gi"
    }
    
    timeout_seconds = 300
    max_instance_count = 5
    min_instance_count = 0

    // Connect to Cloud SQL via VPC connector (for private IP)
    vpc_access {
      connector = "cloud-sql"
      type = "PRIVATE_IP"
    }
    
    // Connect to Cloud Memorystore via VPC connector
    vpc_access {
      connector = "cloud-sql"
      type = "PRIVATE_IP"
    }
  }
}

/**
 * Cloud Storage Buckets
 */
resource "google_storage_bucket" "documents" {
  name          = "lexigov-documents-${var.environment}"
  location      = var.gcp_region
  uniform_bucket_level_access = true
  force_destroy = var.environment == "prod" ? false : true
  
  versioning {
    enabled = false
  }
}

resource "google_storage_bucket" "exports" {
  name          = "lexigov-exports-${var.environment}"
  location      = var.gcp_region
  uniform_bucket_level_access = true
  force_destroy = var.environment == "prod" ? false : true
  
  versioning {
    enabled = false
  }
}

resource "google_storage_bucket" "assets" {
  name          = "lexigov-assets"
  location      = var.gcp_region
  uniform_bucket_level_access = true
  
  versioning {
    enabled = false
  }
}

/**
 * Cloud IAM Service Accounts
 */
resource "google_service_account" "web_service_account" "default" {
  account_id   = var.web_service_account_id
  display_name = "LexiGov Web Service Account"
}

resource "google_service_account_iam_binding" "web_service_account_iam_binding" "default" {
  service_account_id = var.web_service_account_id
  role           = "roles/run.invoker"
  member         = "allUsers"
}
