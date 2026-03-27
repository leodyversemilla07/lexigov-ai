/**
 * Shared Zod Enums
 * Matches the current Clerk + Convex application contracts
 */
import { z } from 'zod'

// Jurisdiction levels (lowercase to match existing types)
export const jurisdictionLevelSchema = z.enum([
    'barangay',
    'city',
    'municipal',
    'provincial'
])
export type JurisdictionLevel = z.infer<typeof jurisdictionLevelSchema>

// Document types stored in Convex
export const documentTypeSchema = z.enum([
    'ORDINANCE',
    'RESOLUTION',
    'MEMORANDUM',
    'POLICY'
])
export type DocumentType = z.infer<typeof documentTypeSchema>

// Document status workflow
export const documentStatusSchema = z.enum([
    'DRAFT',
    'REVIEW',
    'FINAL',
    'ARCHIVED'
])
export type DocumentStatus = z.infer<typeof documentStatusSchema>

// User roles
export const userRoleSchema = z.enum([
    'ADMIN',
    'LEGISLATIVE_STAFF',
    'BARANGAY_SECRETARY',
    'CITY_COUNCIL',
    'RESEARCHER'
])
export type UserRole = z.infer<typeof userRoleSchema>

// Audit actions
export const auditActionSchema = z.enum([
    'CREATE',
    'UPDATE',
    'DELETE',
    'EXPORT',
    'AI_GENERATE',
    'RESTORE_VERSION',
    'MERGE_AMENDMENT',
    'SIGN_DOCUMENT'
])
export type AuditAction = z.infer<typeof auditActionSchema>

// Supported export types in the current MVP
export const exportTypeSchema = z.enum(['txt', 'md', 'docx', 'pdf'])
export type ExportType = z.infer<typeof exportTypeSchema>
