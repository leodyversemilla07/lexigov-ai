/**
 * Shared Zod Enums
 * Shared application contracts for web forms and API DTOs
 */
import { z } from 'zod';

// Jurisdiction levels (lowercase to match existing types)
export const jurisdictionLevelValues = ['barangay', 'city', 'municipal', 'provincial'] as const;
export const jurisdictionLevelSchema = z.enum(jurisdictionLevelValues);
export type JurisdictionLevel = z.infer<typeof jurisdictionLevelSchema>;

// Document types stored for drafts and templates
export const documentTypeValues = ['ORDINANCE', 'RESOLUTION', 'MEMORANDUM', 'POLICY'] as const;
export const documentTypeSchema = z.enum(documentTypeValues);
export type DocumentType = z.infer<typeof documentTypeSchema>;

// Document status workflow (combines MVP statuses and formal RA 7160 legislative stages)
export const documentStatusValues = [
  'DRAFT',
  'REVIEW',
  'FINAL',
  'ARCHIVED',
  'FIRST_READING',
  'COMMITTEE_REVIEW',
  'SECOND_READING',
  'THIRD_READING',
  'SANGGUNIAN_ENACTED',
  'LCE_REVIEW',
  'LCE_APPROVED',
  'LCE_VETOED',
  'HIGHER_SANGGUNIAN_REVIEW',
  'ENACTED_PUBLISHED',
] as const;
export const documentStatusSchema = z.enum(documentStatusValues);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

// User roles (including Sanggunian officers and legislative staff)
export const userRoleValues = [
  'ADMIN',
  'LEGISLATIVE_STAFF',
  'BARANGAY_SECRETARY',
  'CITY_COUNCIL',
  'RESEARCHER',
  'PRESIDING_OFFICER',
  'COMMITTEE_CHAIR',
  'SANGGUNIAN_SECRETARY',
  'CITIZEN_VIEWER',
] as const;
export const userRoleSchema = z.enum(userRoleValues);
export type UserRole = z.infer<typeof userRoleSchema>;

// Audit actions
export const auditActionValues = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'AI_GENERATE',
  'RESTORE_VERSION',
  'MERGE_AMENDMENT',
  'SIGN_DOCUMENT',
] as const;
export const auditActionSchema = z.enum(auditActionValues);
export type AuditAction = z.infer<typeof auditActionSchema>;

// Supported export types in the current MVP
export const exportTypeValues = ['txt', 'md', 'docx', 'pdf'] as const;
export const exportTypeSchema = z.enum(exportTypeValues);
export type ExportType = z.infer<typeof exportTypeSchema>;

export function isJurisdictionLevel(value: unknown): value is JurisdictionLevel {
  return typeof value === 'string' && (jurisdictionLevelValues as readonly string[]).includes(value);
}

export function toJurisdictionLevel(value: unknown, fallback: JurisdictionLevel = 'barangay'): JurisdictionLevel {
  if (isJurisdictionLevel(value)) {
    return value;
  }
  return fallback;
}

export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === 'string' && (documentTypeValues as readonly string[]).includes(value);
}

export function toDocumentType(value: unknown, fallback: DocumentType = 'ORDINANCE'): DocumentType {
  if (isDocumentType(value)) {
    return value;
  }
  return fallback;
}

export function isDocumentStatus(value: unknown): value is DocumentStatus {
  return typeof value === 'string' && (documentStatusValues as readonly string[]).includes(value);
}

export function toDocumentStatus(value: unknown, fallback: DocumentStatus = 'DRAFT'): DocumentStatus {
  if (isDocumentStatus(value)) {
    return value;
  }
  return fallback;
}
