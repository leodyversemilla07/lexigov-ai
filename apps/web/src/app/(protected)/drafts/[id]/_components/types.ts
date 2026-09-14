import type { DocumentStatus, DraftSection, SanggunianRole } from '@lexigov/shared';

export type ComplianceIssue = {
  type: 'critical' | 'warning' | 'suggestion';
  section?: string;
  title: string;
  description: string;
  suggestion: string;
};

export type ComplianceResult = {
  overallScore: number;
  isValid: boolean;
  issues: ComplianceIssue[];
};

export type ComplianceSummaryData = {
  overallScore: number;
  isValid: boolean;
  issuesCount: number;
  warningsCount: number;
  suggestionsCount: number;
  checkedAt: number | string;
};

export type DraftVersion = {
  id: string;
  title: string;
  status: string;
  version: number;
  updatedAt: string;
  createdAt: string;
  commitMessage?: string;
  isCurrent: boolean;
  body: string;
};

export type ComplianceReport = {
  id: string;
  draftId: string;
  draftVersion: number;
  revisionDraftId?: string;
  overallScore: number;
  isValid: boolean;
  issuesCount: number;
  warningsCount: number;
  suggestionsCount: number;
  checkedAt: string;
};

export type Draft = {
  id: string;
  title: string;
  documentType: string;
  jurisdiction: string;
  jurisdictionName: string;
  content: unknown;
  status: string;
  aiGenerated: boolean;
  userId: string;
  organizationId?: string;
  templateId?: string;
  version: number;
  parentDraftId?: string;
  commitMessage?: string;
  createdAt: string;
  updatedAt: string;
  effectiveRole?: SanggunianRole | null;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type DraftEditorState = {
  title: string;
  content: string;
  status: DocumentStatus;
  sections: DraftSection[];
  selectedSectionId: string;
};

export const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft in progress' },
  { value: 'REVIEW', label: 'Internal review' },
  { value: 'FINAL', label: 'Editing complete (working draft)' },
  { value: 'ARCHIVED', label: 'Archived working draft' },
] as const;

export const STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-800',
  FIRST_READING: 'border-blue-200 bg-blue-50 text-blue-800',
  COMMITTEE_REVIEW: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  SECOND_READING: 'border-violet-200 bg-violet-50 text-violet-800',
  THIRD_READING: 'border-purple-200 bg-purple-50 text-purple-800',
  SANGGUNIAN_ENACTED: 'border-teal-200 bg-teal-50 text-teal-800',
  LCE_REVIEW: 'border-orange-200 bg-orange-50 text-orange-800',
  LCE_APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  LCE_VETOED: 'border-rose-200 bg-rose-50 text-rose-800',
  HIGHER_SANGGUNIAN_REVIEW: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  ENACTED_PUBLISHED: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  REVIEW: 'border-sky-200 bg-sky-50 text-sky-800',
  FINAL: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ARCHIVED: 'border-slate-200 bg-slate-100 text-slate-700',
};
