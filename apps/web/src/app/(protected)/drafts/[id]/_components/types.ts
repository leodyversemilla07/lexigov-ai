import { type DocumentStatus, type DraftSection, LEGISLATIVE_STAGES } from '@lexigov/shared';

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
  documentHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type DraftEditorState = {
  title: string;
  content: string;
  status: DocumentStatus;
  sections: DraftSection[];
  selectedSectionId: string;
};

export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  ...LEGISLATIVE_STAGES.map((stage) => ({ value: stage.stage, label: stage.label })),
  { value: 'VETOED', label: 'Vetoed by LCE' },
  { value: 'LAPSED_INTO_LAW', label: 'Lapsed into Law' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'General Review' },
  { value: 'FINAL', label: 'Final' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-800',
  DRAFTING: 'border-amber-200 bg-amber-50 text-amber-800',
  FIRST_READING: 'border-blue-200 bg-blue-50 text-blue-800',
  COMMITTEE_REVIEW: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  SECOND_READING: 'border-violet-200 bg-violet-50 text-violet-800',
  THIRD_READING: 'border-purple-200 bg-purple-50 text-purple-800',
  TRANSMITTED_TO_LCE: 'border-orange-200 bg-orange-50 text-orange-800',
  ENACTED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  VETOED: 'border-rose-200 bg-rose-50 text-rose-800',
  LAPSED_INTO_LAW: 'border-slate-200 bg-slate-100 text-slate-700',
  REVIEW: 'border-sky-200 bg-sky-50 text-sky-800',
  FINAL: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ARCHIVED: 'border-slate-200 bg-slate-100 text-slate-700',
};
