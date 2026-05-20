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
  mergeComplianceIssues,
} from './compliance-analysis';
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
  extractDraftSections,
  normalizeDraftContent,
  updateDraftBodyContent,
  updateDraftSectionsContent,
} from './draft-content';
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
export type {
  CreateTemplateInput,
  TemplateCategory,
  TemplateEditorInput,
  TemplateQueryInput,
  TemplateVisibility,
  UpdateTemplateInput,
} from './schemas/template';
export * from './schemas/template';
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
export { cn } from './utils';
