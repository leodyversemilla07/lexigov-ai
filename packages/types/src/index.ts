/**
 * Philippine Ordinance Data Structures
 * Based on RA 7160 (Local Government Code of 1991)
 */

/**
 * Jurisdiction levels for Philippine LGUs
 */
export type JurisdictionLevel = 'barangay' | 'city' | 'municipal' | 'provincial';

/**
 * Document types
 */
export type DocumentType = 'ORDINANCE' | 'RESOLUTION' | 'MEMORANDUM' | 'POLICY';

/**
 * Document status workflow
 */
export type DocumentStatus = 'DRAFT' | 'REVIEW' | 'FINAL' | 'ARCHIVED';

/**
 * User roles in the system
 */
export type UserRole =
  | 'ADMIN'
  | 'LEGISLATIVE_STAFF'
  | 'BARANGAY_SECRETARY'
  | 'CITY_COUNCIL'
  | 'RESEARCHER';

/**
 * Penalty limits by jurisdiction (RA 7160)
 */
export const PENALTY_LIMITS = {
  barangay: { fine: 1000, imprisonmentMonths: 1, imprisonmentType: 'court' },
  city: { fine: 5000, imprisonmentMonths: 12, imprisonmentType: 'court' },
  municipal: { fine: 5000, imprisonmentMonths: 12, imprisonmentType: 'court' },
  provincial: { fine: null, imprisonmentMonths: null, imprisonmentType: null },
} as const;

/**
 * Main ordinance structure following Philippine legal format
 */
export interface PhilippineOrdinance {
  /**
   * Document metadata
   */
  metadata: OrdinanceMetadata;

  /**
   * Header information (official document header)
   */
  header: OrdinanceHeader;

  /**
   * Preamble (WHEREAS clauses)
   */
  preamble: OrdinancePreamble;

  /**
   * Main body sections
   */
  body: OrdinanceBody;

  /**
   * Final provisions (required for validity)
   */
  finalProvisions: FinalProvisions;

  /**
   * Compliance status
   */
  compliance: ComplianceStatus;
}

/**
 * Document metadata
 */
export interface OrdinanceMetadata {
  /** Document number (e.g., ORD-2024-001) */
  documentNumber: string;

  /** Full title of ordinance */
  title: string;

  /** Document type */
  documentType: DocumentType;

  /** Jurisdiction details */
  jurisdiction: JurisdictionDetails;

  /** Creation date (ISO format) */
  dateCreated: string;

  /** Authors/Signatories */
  authors: string[];

  /** When ordinance takes effect */
  effectiveDate?: string;
}

/**
 * Jurisdiction details
 */
export interface JurisdictionDetails {
  /** LGU level */
  level: JurisdictionLevel;

  /** Name of LGU */
  name: string;

  /** Province (optional) */
  province?: string;

  /** City/Municipality (optional) */
  city?: string;
}

/**
 * Official document header
 */
export interface OrdinanceHeader {
  /** "Republic of the Philippines" */
  republic: string;

  /** Province name */
  province: string;

  /** City or Municipality name */
  cityMunicipality: string;

  /** Barangay name (if applicable) */
  barangay?: string;

  /** Document type (e.g., "BARANGAY ORDINANCE") */
  documentType: string;

  /** Ordinance number */
  ordinanceNumber: string;
}

/**
 * Preamble with WHEREAS clauses
 */
export interface OrdinancePreamble {
  /** Enacting clause (standard format) */
  enactingClause: string;

  /** WHEREAS clauses with legal bases */
  whereasClauses: WhereasClause[];
}

/**
 * Individual WHEREAS clause
 */
export interface WhereasClause {
  /** Clause number */
  number: number;

  /** Content of clause */
  content: string;

  /** Legal basis citation (e.g., "Section 16, RA 7160") */
  legalBasis?: string;

  /** Reference/Supporting fact */
  reference?: string;
}

/**
 * Main body of ordinance
 */
export interface OrdinanceBody {
  /** Numbered sections */
  sections: OrdinanceSection[];

  /** Optional exceptions */
  exceptions?: ExceptionsClause;
}

/**
 * Individual ordinance section
 */
export interface OrdinanceSection {
  /** Section number */
  number: number;

  /** Section title */
  title: string;

  /** Section content */
  content: string;

  /** For prohibited acts sections */
  prohibitedActs?: ProhibitedAct[];

  /** For penalty sections */
  penalties?: PenaltyClause[];

  /** For enforcement sections */
  enforcement?: EnforcementClause;

  /** Optional subsections */
  subsections?: OrdinanceSubsection[];
}

/**
 * Ordinance subsection
 */
export interface OrdinanceSubsection {
  /** Subsection letter (a, b, c...) */
  letter: string;

  /** Content */
  content: string;
}

/**
 * Prohibited act definition
 */
export interface ProhibitedAct {
  /** Letter designation (a, b, c...) */
  letter: string;

  /** Description of prohibited act */
  description: string;

  /** Elements of the offense */
  elements?: string[];
}

/**
 * Exceptions clause
 */
export interface ExceptionsClause {
  /** Section title */
  title: string;

  /** List of exceptions */
  items: Exception[];
}

/**
 * Individual exception
 */
export interface Exception {
  /** Exception description */
  exception: string;

  /** Condition for exception */
  condition?: string;
}

/**
 * Penalty clause
 */
export interface PenaltyClause {
  /** Description of offense */
  offense: string;

  /** Fine amount */
  fine: string;

  /** Imprisonment term */
  imprisonment?: string;

  /** Alternative penalty */
  alternative?: string;

  /** Whether court action required */
  courtRequired?: boolean;
}

/**
 * Enforcement clause
 */
export interface EnforcementClause {
  /** Responsible officer/department */
  responsible: string;

  /** Enforcement mechanism */
  mechanism: string;

  /** Appeal process description */
  appealProcess: string;
}

/**
 * Final provisions (required sections)
 */
export interface FinalProvisions {
  /** Separability clause */
  separabilityClause: boolean;

  /** Custom separability text */
  separabilityText?: string;

  /** Repealing clause */
  repealingClause: boolean;

  /** Ordinances being repealed */
  repealedOrdinances?: string[];

  /** Effectivity clause */
  effectivityClause: boolean;

  /** Custom effectivity text */
  effectivityText: string;

  /** Posting requirement */
  postingRequirement?: string;

  /** Signatures */
  signatures: Signature[];

  /** Certification details */
  certification?: Certification;
}

/**
 * Signature information
 */
export interface Signature {
  /** Signatory name */
  name: string;

  /** Position/title */
  position: SignaturePosition;

  /** Date signed */
  signatureDate?: string;

  /** Whether signature is present */
  signature?: boolean;
}

/**
 * Valid signature positions
 */
export type SignaturePosition =
  | 'Punong Barangay'
  | 'Barangay Secretary'
  | 'Sanggunian Member'
  | 'Mayor'
  | 'City Mayor'
  | 'Municipal Mayor';

/**
 * Certification details
 */
export interface Certification {
  /** Date adopted */
  adopted: string;

  /** Voting results (e.g., "6-0-0") */
  votes: string;

  /** Attestation text */
  attestedBy: string;
}

/**
 * Compliance status
 */
export interface ComplianceStatus {
  /** Overall validity */
  isValidStructure: boolean;

  /** Has required sections */
  hasRequiredSections: boolean;

  /** Penalties within legal limits */
  penaltyWithinLimits: boolean;

  /** Has effectivity clause */
  hasEffectivityClause: boolean;

  /** Has separability clause */
  hasSeparabilityClause: boolean;

  /** Has repealing clause */
  hasRepealingClause: boolean;

  /** Due process adequate */
  dueProcessAdequate: boolean;

  /** Compliance score (0-100) */
  score?: number;
}

/**
 * Compliance issue found
 */
export interface ComplianceIssue {
  /** Issue severity */
  type: 'critical' | 'warning' | 'suggestion';

  /** Section number (if applicable) */
  section?: number;

  /** Issue title */
  title: string;

  /** Detailed description */
  description: string;

  /** Suggested fix */
  suggestion: string;

  /** Legal reference (if applicable) */
  legalReference?: string;
}

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
 * Template structure with placeholders
 */
export interface TemplateStructure {
  /** Template sections */
  sections: OrdinanceSection[];

  /** Placeholder keys */
  placeholders: TemplatePlaceholder[];
}

/**
 * Template placeholder
 */
export interface TemplatePlaceholder {
  /** Placeholder key (e.g., "barangay_name") */
  key: string;

  /** Display label */
  label: string;

  /** Default value */
  default?: string;

  /** Required flag */
  required: boolean;
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

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;

  /** Action performed */
  action: string;

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
 * AI generation parameters
 */
export interface OrdinanceGenerationParams {
  /** Topic/title */
  topic: string;

  /** Ordinance type */
  ordinanceType: JurisdictionLevel;

  /** Jurisdiction details */
  jurisdiction: {
    name: string;
    province?: string;
    city?: string;
  };

  /** Problem statement */
  problemStatement: string;

  /** Objectives */
  objectives: string[];

  /** Target population */
  targetPopulation: string;

  /** Prohibited acts */
  prohibitedActs: string[];

  /** Enforcement body */
  enforcementBody: string;

  /** Optional penalty details */
  penalties?: {
    firstOffense?: string;
    secondOffense?: string;
    thirdOffense?: string;
  };

  /** Optional exceptions */
  exceptions?: string[];

  /** Budget considerations */
  budget?: string;
}

/**
 * AI generation response
 */
export interface OrdinanceGenerationResponse {
  /** Generated ordinance */
  ordinance: PhilippineOrdinance;

  /** Generation timestamp */
  generatedAt: Date;

  /** Model used */
  model: string;

  /** Token usage */
  tokens: {
    input: number;
    output: number;
    total: number;
  };
}
