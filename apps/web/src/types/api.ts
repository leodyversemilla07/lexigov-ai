export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiDraft {
  id: string;
  title: string;
  documentType: string;
  jurisdiction: string;
  jurisdictionName: string;
  status: string;
  aiGenerated?: boolean;
  version: number;
  content?: unknown;
  userId?: string;
  organizationId?: string;
  templateId?: string;
  parentDraftId?: string;
  commitMessage?: string;
  documentHash?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface ApiDraftVersion {
  id: string;
  title: string;
  status: string;
  version: number;
  updatedAt: string;
  createdAt: string;
  commitMessage?: string;
  isCurrent: boolean;
  body: string;
}

export interface ApiComplianceIssue {
  type: 'critical' | 'warning' | 'suggestion';
  section?: string;
  title: string;
  description: string;
  suggestion: string;
}

export interface ApiComplianceResult {
  overallScore: number;
  isValid: boolean;
  issues: ApiComplianceIssue[];
}

export interface ApiComplianceReport {
  id: string;
  draftId?: string;
  draftVersion: number;
  revisionDraftId?: string;
  overallScore: number;
  isValid: boolean;
  issuesCount: number;
  warningsCount: number;
  suggestionsCount: number;
  checkedAt: string;
}
