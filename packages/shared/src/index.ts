// Schemas

export type {
  ComplianceIssue,
  ComplianceIssueType,
  ComplianceResult,
} from './compliance-analysis';
// Compliance analysis
export {
  analyzeDeterministicCompliance,
  buildComplianceResultFromIssues,
  jurisdictionPenaltyGuidance,
  mergeComplianceIssues,
} from './compliance-analysis';
// Official Philippine Government Document Formatter
export type {
  DocumentFormatConfig,
  DocumentSessionDetails,
  DocumentSignatories,
  FontFamily,
  FormattedDocumentData,
  LineSpacing,
  PaperSize,
  ParsedOrdinanceStructure,
} from './document-formatter';
export {
  buildDefaultDocumentFormatConfig,
  extractWhereAsClausesAndBody,
  generateOfficialDocumentText,
  inferDefaultSignatories,
  inferSanggunianBodyName,
} from './document-formatter';
// Document Verification & Integrity
export type { VerificationMetadata } from './document-verification';
export {
  buildVerificationMetadata,
  generateDocumentFingerprint,
  generateVerificationHash,
} from './document-verification';
export type {
  DraftSection,
  StructuredDraftContent,
} from './draft-content';
// Draft content utilities
export {
  buildDraftSectionsFromBody,
  buildDraftSummary,
  composeDraftBodyFromSections,
  createDraftSection,
  extractDraftBody,
  extractDraftMilestones,
  extractDraftSections,
  normalizeDraftContent,
  updateDraftBodyContent,
  updateDraftMilestonesContent,
  updateDraftSectionsContent,
} from './draft-content';
// Sanggunian Legislative Tracker & RBAC
export type {
  EnactmentBasis,
  LegislativeMilestones,
  LegislativeStage,
  LegislativeStageMetadata,
  StageValidationResult,
  VotingRecord,
} from './legislative-tracker';
export {
  calculateTransmittalDeadline,
  getDefaultMilestones,
  getLegislativeStages,
  LEGISLATIVE_STAGES,
  SANGGUNIAN_ROLE_LABELS,
  STAGE_TRANSITION_ROLES,
  validateStageTransition,
} from './legislative-tracker';
export type { AIDraftFormInput } from './schemas/ai';
export * from './schemas/ai';
export * from './schemas/auth';
// Types (re-exports from schemas)
export type {
  CreateDraftInput,
  DraftComposerInput,
  DraftContentInput,
  DraftQueryInput,
  JurisdictionDetailsInput,
  UpdateDraftInput,
} from './schemas/draft';
export * from './schemas/draft';
export * from './schemas/enums';
export * from './schemas/legislative';
export type {
  CreateTemplateInput,
  TemplateCategory,
  TemplateEditorInput,
  TemplateQueryInput,
  TemplateVisibility,
  UpdateTemplateInput,
} from './schemas/template';
export * from './schemas/template';

// Statutory Citations & Legal Grounding
export type { StatutoryCitation } from './statutory-citations';
export {
  generateSuggestedWhereasClauses,
  getStatutoryCitations,
  PHILIPPINE_STATUTORY_DATABASE,
} from './statutory-citations';
export type { TemplateData } from './template-utils';
// Template utilities
export {
  getTemplateBody,
  getTemplateDescription,
  getTemplateDocumentType,
  getTemplateJurisdiction,
  getTemplatePrompt,
  getTemplateSections,
} from './template-utils';
// Test Data Factories & Fixtures
export * from './testing';
export type {
  DiffRow,
  DiffRowType,
  SectionDiffRow,
  SectionDiffType,
} from './text-diff';
// Text diff utilities
export {
  buildLineDiff,
  buildSectionDiff,
} from './text-diff';
// Utils
export { escapeHtml } from './html';
export { cn } from './utils';
