// Schemas
export * from "./schemas/enums";
export * from "./schemas/auth";
export * from "./schemas/draft";
export * from "./schemas/template";
export * from "./schemas/ai";

// Types (re-exports from schemas)
export type {
    DraftContentInput,
    JurisdictionDetailsInput,
    CreateDraftInput,
    DraftComposerInput,
    UpdateDraftInput,
    DraftQueryInput,
} from "./schemas/draft";
export type {
    TemplateCategory,
    TemplateVisibility,
    CreateTemplateInput,
    TemplateEditorInput,
    UpdateTemplateInput,
    TemplateQueryInput,
} from "./schemas/template";
export type {
    AIDraftFormInput,
} from "./schemas/ai";

// Draft content utilities
export {
    buildDraftSectionsFromBody,
    composeDraftBodyFromSections,
    createDraftSection,
    extractDraftBody,
    extractDraftSections,
    buildDraftSummary,
    normalizeDraftContent,
    updateDraftBodyContent,
    updateDraftSectionsContent,
} from "./draft-content";
export type {
    DraftSection,
    StructuredDraftContent,
} from "./draft-content";

// Compliance analysis
export {
    analyzeDeterministicCompliance,
    buildComplianceResultFromIssues,
    mergeComplianceIssues,
} from "./compliance-analysis";
export type {
    ComplianceIssue,
    ComplianceIssueType,
    ComplianceResult,
} from "./compliance-analysis";

// Template utilities
export {
    getTemplateDescription,
    getTemplateDocumentType,
    getTemplateJurisdiction,
    getTemplatePrompt,
    getTemplateBody,
    getTemplateSections,
} from "./template-utils";
export type {
    TemplateData,
} from "./template-utils";

// Text diff utilities
export {
    buildLineDiff,
    buildSectionDiff,
} from "./text-diff";
export type {
    DiffRow,
    DiffRowType,
    SectionDiffRow,
    SectionDiffType,
} from "./text-diff";

// Utils
export { cn } from "./utils";
