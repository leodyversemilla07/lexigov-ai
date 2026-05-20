/**
 * Shared Zod Enums
 * Matches the current Clerk + Convex application contracts
 */
import { z } from 'zod';

// Jurisdiction levels (lowercase to match existing types)
export const jurisdictionLevelValues = ['barangay', 'city', 'municipal', 'provincial'] as const;
export const jurisdictionLevelSchema = z.enum(jurisdictionLevelValues);
export type JurisdictionLevel = z.infer<typeof jurisdictionLevelSchema>;

// Document types stored in Convex
export const documentTypeValues = ['ORDINANCE', 'RESOLUTION', 'MEMORANDUM', 'POLICY'] as const;
export const documentTypeSchema = z.enum(documentTypeValues);
export type DocumentType = z.infer<typeof documentTypeSchema>;

// Document status workflow
export const documentStatusValues = ['DRAFT', 'REVIEW', 'FINAL', 'ARCHIVED'] as const;
export const documentStatusSchema = z.enum(documentStatusValues);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

// User roles
export const userRoleValues = [
  'ADMIN',
  'LEGISLATIVE_STAFF',
  'BARANGAY_SECRETARY',
  'CITY_COUNCIL',
  'RESEARCHER',
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
