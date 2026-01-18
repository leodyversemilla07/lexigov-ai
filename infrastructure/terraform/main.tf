/**
 * GCP Infrastructure for LexiGov AI
 * Region: asia-southeast2 (Jakarta)
 * Project: lexigov-ai-dev (placeholder)
 */

provider "google-beta" {
  project = var.gcp_project_id
  region  var.gcp_region
  zone   = var.gcp_zone || "asia-southeast2-a"
}

variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP Region"
  type        = string
  default     = "asia-southeast2"
}

variable "gcp_zone" {
  description = "GCP Zone"
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "enable_cloud_armor" {
  description = "Enable Cloud Armor WAF"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Domain name for application"
  type        = string
  default     = "lexigov-ai"
}
