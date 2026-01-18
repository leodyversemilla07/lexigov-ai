/**
 * Cloud SQL for PostgreSQL database
 */
resource "google_sql_database_instance" "postgres" {
  name             = "lexigov-postgres"
  database_version = "POSTGRES_15"
  region           = var.gcp_region
  zone             = var.gcp_zone

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = true
      private_network = true
      require_ssl     = true
    }

    database_flags {
      db_file_flags                  = "BACKUP;DIRECT_LOG_PATH"
      point_in_time_recovery_enabled = true
    }
  }

  deletion_protection = var.environment != "dev" ? true : false

  depends_on = [google_project_service.default]
}

resource "google_project_service" "cloudsql" "default" {
  service = google_sql_database_instance.postgres

  timeouts {
    create = "10m"
    update = "10m"
    delete = "10m"
  }
}
