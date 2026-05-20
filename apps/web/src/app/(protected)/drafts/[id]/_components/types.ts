import type { DocumentStatus, DraftSection } from '@lexigov/shared';

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
  checkedAt: number;
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
  templateId?: string;
  version: number;
  parentDraftId?: string;
  commitMessage?: string;
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

export const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'FINAL', label: 'Final' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

export const STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-800',
  REVIEW: 'border-sky-200 bg-sky-50 text-sky-800',
  FINAL: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ARCHIVED: 'border-slate-200 bg-slate-100 text-slate-700',
};
