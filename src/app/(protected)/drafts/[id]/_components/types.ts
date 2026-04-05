/**
 * Types for the Draft Editor page components
 */
import type { DraftSection } from "@/lib/draft-content";
import type { DocumentStatus } from "@/lib/schemas/enums";
import type { Id } from "@/convex/_generated/dataModel";

export type ComplianceIssue = {
    type: "critical" | "warning" | "suggestion";
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
    _id: string;
    title: string;
    status: string;
    version: number;
    updatedAt: number;
    createdAt: number;
    commitMessage?: string;
    isCurrent: boolean;
    body: string;
};

export type ComplianceReport = {
    _id: string;
    draftId: Id<"drafts">;
    draftVersion: number;
    revisionDraftId?: Id<"drafts">;
    overallScore: number;
    isValid: boolean;
    issuesCount: number;
    warningsCount: number;
    suggestionsCount: number;
    checkedAt: number;
};

export type Draft = {
    _id: Id<"drafts">;
    title: string;
    documentType: string;
    jurisdiction: string;
    jurisdictionName: string;
    content: unknown;
    status: string;
    aiGenerated: boolean;
    userId: Id<"users">;
    templateId?: Id<"templates">;
    version: number;
    parentDraftId?: Id<"drafts">;
    commitMessage?: string;
    createdAt: number;
    updatedAt: number;
};

export type DraftEditorState = {
    title: string;
    content: string;
    status: DocumentStatus;
    sections: DraftSection[];
    selectedSectionId: string;
};

export const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Draft" },
    { value: "REVIEW", label: "Review" },
    { value: "FINAL", label: "Final" },
    { value: "ARCHIVED", label: "Archived" },
] as const;

export const STATUS_CLASSES: Record<string, string> = {
    DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
    REVIEW: "border-sky-200 bg-sky-50 text-sky-800",
    FINAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
    ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};
