/**
 * Terraform Outputs for Cloud Build
 */

output "project_id" {
  description = "GCP Project ID"
  value       = google_project_service.default.project_id
}

output "gcp_project_id" {
  description = "GCP Project ID"
  value       = var.gcp_project_id
}

output "gcp_region" {
  description = "GCP Region"
  value       = var.gcp_region
}

output "gcp_zone" {
  description = "GCP Zone"
  value       = var.gcp_zone
}

output "environment" {
  description = "Environment"
  value       = var.environment
}

output "enable_cloud_armor" {
  description = "Cloud Armor enabled"
  value       = var.enable_cloud_armor
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}
