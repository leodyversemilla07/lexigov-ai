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

// Canonical RA 7160 legislative stages (source of truth for the drafting workflow)
export const legislativeStageValues = [
  'DRAFTING',
  'FIRST_READING',
  'COMMITTEE_REVIEW',
  'SECOND_READING',
  'THIRD_READING',
  'TRANSMITTED_TO_LCE',
  'ENACTED',
  'VETOED',
  'LAPSED_INTO_LAW',
] as const;
export const legislativeStageSchema = z.enum(legislativeStageValues);
export type LegislativeStage = z.infer<typeof legislativeStageSchema>;

// Document status workflow: formal RA 7160 legislative stages plus operational
// MVP lifecycle states. Legacy status names are retained so existing drafts and
// clients remain valid; the formal stages are now the canonical source.
export const draftLifecycleStatuses = ['DRAFT', 'REVIEW', 'FINAL', 'ARCHIVED'] as const;
export const legacyTransitionStatuses = [
  'SANGGUNIAN_ENACTED',
  'LCE_REVIEW',
  'LCE_APPROVED',
  'LCE_VETOED',
  'HIGHER_SANGGUNIAN_REVIEW',
  'ENACTED_PUBLISHED',
] as const;
export const documentStatusValues = [
  ...legislativeStageValues,
  ...draftLifecycleStatuses,
  ...legacyTransitionStatuses,
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

// Formal RA 7160 Sanggunian Roles
export const sanggunianRoleValues = [
  'LGU_ADMIN',
  'LEGISLATIVE_STAFF',
  'COMMITTEE_CHAIR',
  'SANGGUNIAN_SECRETARY',
  'PRESIDING_OFFICER',
  'LCE_OFFICE',
] as const;
export const sanggunianRoleSchema = z.enum(sanggunianRoleValues);
export type SanggunianRole = z.infer<typeof sanggunianRoleSchema>;

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

export function isSanggunianRole(value: unknown): value is SanggunianRole {
  return typeof value === 'string' && (sanggunianRoleValues as readonly string[]).includes(value);
}

export function toSanggunianRole(value: unknown, fallback: SanggunianRole = 'LEGISLATIVE_STAFF'): SanggunianRole {
  if (isSanggunianRole(value)) {
    return value;
  }
  return fallback;
}
