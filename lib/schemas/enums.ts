/**
 * Shared Zod Enums
 * Matches Prisma schema enums for consistent validation
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

// Document types (uppercase to match Prisma)
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

// Export types
export const exportTypeSchema = z.enum(['PDF', 'DOCX'])
export type ExportType = z.infer<typeof exportTypeSchema>
