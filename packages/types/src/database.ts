/**
 * Database entity types
 * These extend/complement the Prisma generated types
 */

import type {
  DocumentType,
  DocumentStatus,
  UserRole,
  JurisdictionDetails,
  PhilippineOrdinance,
  JurisdictionLevel,
  TemplateStructure,
} from './ordinance.js'

/**
 * Draft in database
 */
export interface Draft {
  id: string;

  /** Ordinance title */
  title: string;

  /** Document type */
  documentType: DocumentType;

  /** Jurisdiction */
  jurisdiction: JurisdictionDetails;

  /** Structured content */
  content: PhilippineOrdinance;

  /** Current status */
  status: DocumentStatus;

  /** AI-generated flag */
  aiGenerated: boolean;

  /** User who created draft */
  userId: string;

  /** Template used (optional) */
  templateId?: string;

  /** Version number */
  version: number;

  /** Parent draft (for versioning) */
  parentDraftId?: string;

  /** Audit log of changes */
  commitMessage?: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Template in database
 */
export interface Template {
  id: string;

  /** Template name */
  name: string;

  /** Category (Environment, Health, etc.) */
  category: string;

  /** Subcategory */
  subcategory?: string;

  /** Target jurisdiction */
  jurisdiction: JurisdictionLevel[];

  /** Template structure with placeholders */
  structure: TemplateStructure;

  /** Example filled content */
  exampleContent?: PhilippineOrdinance;

  /** Public visibility */
  isPublic: boolean;

  /** Usage analytics */
  usageCount: number;

  /** Creator user ID */
  userId: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * User in database
 */
export interface User {
  id: string;

  /** Email address */
  email: string;

  /** Display name */
  name?: string;

  /** User role */
  role: UserRole;

  /** Organization/LGU name */
  organization?: string;

  /** Firebase UID */
  firebaseUid?: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Audit action types
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'AI_GENERATE'
  | 'RESTORE_VERSION'
  | 'MERGE_AMENDMENT'
  | 'SIGN_DOCUMENT';

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;

  /** Action performed */
  action: AuditAction;

  /** Entity type (Draft, Template, etc.) */
  entityType: string;

  /** Entity ID */
  entityId: string;

  /** User who performed action */
  userId: string;

  /** Changes made */
  changes?: Record<string, unknown>;

  /** IP address */
  ipAddress?: string;

  /** Timestamp */
  createdAt: Date;
}

/**
 * Export history entry
 */
export interface ExportHistory {
  id: string;

  /** Draft that was exported */
  draftId: string;

  /** Export format (PDF, DOCX) */
  exportType: 'PDF' | 'DOCX';

  /** URL to exported file */
  fileUrl: string;

  /** File size in bytes */
  fileSize: number;

  /** Number of pages */
  pageCount?: number;

  /** User who exported */
  exportedBy: string;

  /** Timestamp */
  createdAt: Date;
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  id: string;

  /** Draft that was checked */
  draftId: string;

  /** Overall compliance score (0-100) */
  overallScore: number;

  /** Whether document is valid */
  isValid: boolean;

  /** Number of issues */
  issuesCount: number;

  /** Number of warnings */
  warningsCount: number;

  /** Number of suggestions */
  suggestionsCount: number;

  /** Detailed issues (JSON) */
  issues: Record<string, unknown>;

  /** Timestamp of check */
  checkedAt: Date;
}

/**
 * Version comparison data
 */
export interface VersionComparison {
  id: string;

  /** Draft being compared */
  draftId: string;

  /** Starting version */
  versionFrom: number;

  /** Ending version */
  versionTo: number;

  /** Changes summary (JSON) */
  changes: Record<string, unknown>;

  /** Timestamp */
  createdAt: Date;
}
