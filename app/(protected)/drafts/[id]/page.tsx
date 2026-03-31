"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle,
    CheckCircle2,
    Download,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Shield,
    Sparkles,
    Trash2,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    DraftSection,
    buildDraftSectionsFromBody,
    composeDraftBodyFromSections,
    createDraftSection,
    extractDraftBody,
    extractDraftSections,
    updateDraftSectionsContent,
} from "@/lib/draft-content";
import type { DocumentStatus } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ComplianceResult = {
    overallScore: number;
    isValid: boolean;
    issues: Array<{
        type: "critical" | "warning" | "suggestion";
        section?: string;
        title: string;
        description: string;
        suggestion: string;
    }>;
};

const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "REVIEW", label: "Review" },
    { value: "FINAL", label: "Final" },
    { value: "ARCHIVED", label: "Archived" },
];

const statusClasses: Record<string, string> = {
    DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
    REVIEW: "border-sky-200 bg-sky-50 text-sky-800",
    FINAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
    ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};

function MetricCard({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div className="mt-2 text-2xl font-bold">{value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
            </CardContent>
        </Card>
    );
}

function SidePanelCard({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="p-4">{children}</CardContent>
        </Card>
    );
}

function SectionListItem({
    section,
    index,
    active,
    onSelect,
}: {
    section: DraftSection;
    index: number;
    active: boolean;
    onSelect: (sectionId: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(section.id)}
            className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                active
                    ? "border-primary bg-muted"
                    : "bg-background hover:bg-muted/50",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Section {index + 1}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                        {section.heading}
                    </div>
                </div>
                <Badge variant="outline" className="rounded-full">
                    {section.body.trim() ? `${section.body.trim().split(/\s+/).length}w` : "Empty"}
                </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {section.body || "No supporting body text yet."}
            </p>
        </button>
    );
}

function ComplianceSummary({
    complianceResult,
    isCheckingCompliance,
    onRefresh,
    onDismiss,
}: {
    complianceResult: ComplianceResult;
    isCheckingCompliance: boolean;
    onRefresh: () => void;
    onDismiss: () => void;
}) {
    return (
        <Card
            className={cn(
                "",
                complianceResult.isValid
                    ? "border-emerald-200 bg-emerald-50/80"
                    : "border-amber-200 bg-amber-50/90",
            )}
        >
            <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-2xl border",
                            complianceResult.isValid
                                ? "border-emerald-200 bg-white text-emerald-700"
                                : "border-amber-200 bg-white text-amber-700",
                        )}
                    >
                        {complianceResult.isValid ? (
                            <CheckCircle2 className="h-5 w-5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5" />
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-lg">RA 7160 Compliance Snapshot</CardTitle>
                        <CardDescription className="mt-1 text-sm text-foreground/70">
                            Score {complianceResult.overallScore}/100 with {complianceResult.issues.length} flagged
                            {complianceResult.issues.length === 1 ? " issue" : " issues"}.
                        </CardDescription>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onRefresh} disabled={isCheckingCompliance}>
                        {isCheckingCompliance ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        )}
                        Re-check
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={onDismiss}>
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
                {complianceResult.issues.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4 text-sm text-emerald-800">
                        No issues were found in this pass.
                    </div>
                ) : (
                    complianceResult.issues.map((issue, index) => (
                        <div
                            key={`${issue.title}-${index}`}
                            className={cn(
                                "rounded-2xl border p-4 shadow-sm",
                                issue.type === "critical" && "border-red-200 bg-red-50/80",
                                issue.type === "warning" && "border-amber-200 bg-amber-50/90",
                                issue.type === "suggestion" && "border-sky-200 bg-sky-50/80",
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold">{issue.title}</div>
                                    {issue.section ? (
                                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                            {issue.section}
                                        </div>
                                    ) : null}
                                </div>
                                <Badge
                                    className={cn(
                                        "rounded-full border capitalize",
                                        issue.type === "critical" && "border-red-300 bg-white text-red-700",
                                        issue.type === "warning" && "border-amber-300 bg-white text-amber-700",
                                        issue.type === "suggestion" && "border-sky-300 bg-white text-sky-700",
                                    )}
                                >
                                    {issue.type}
                                </Badge>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-foreground/80">{issue.description}</p>
                            {issue.suggestion ? (
                                <div className="mt-3 rounded-xl bg-white/75 p-3 text-sm leading-6 text-foreground/75">
                                    <span className="font-medium text-foreground">Suggested fix:</span> {issue.suggestion}
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

export default function DraftEditorPage() {
    const params = useParams();
    const draftId = params.id as Id<"drafts">;

    const draft = useQuery(api.drafts.get, { id: draftId });
    const versionHistory = useQuery(api.drafts.listVersions, { draftId });
    const complianceHistory = useQuery(api.complianceReports.listByDraft, { draftId, limit: 3 });
    const updateDraft = useMutation(api.drafts.update);
    const saveComplianceReport = useMutation(api.complianceReports.save);
    const checkCompliance = useAction(api.ai.checkCompliance);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
    const [showCompliance, setShowCompliance] = useState(false);
    const [status, setStatus] = useState<DocumentStatus>("DRAFT");
    const [sections, setSections] = useState<DraftSection[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState("");

    useEffect(() => {
        if (!draft) return;

        const body = extractDraftBody(draft.content);
        const parsedSections = extractDraftSections(draft.content);

        setTitle(draft.title);
        setContent(body);
        setSections(parsedSections);
        setSelectedSectionId(parsedSections[0]?.id ?? "");
        setStatus(draft.status as DocumentStatus);
    }, [draft]);

    const sectionOutline = sections.length > 0 ? sections : buildDraftSectionsFromBody(content);
    const selectedSection = sectionOutline.find((section) => section.id === selectedSectionId) ?? sectionOutline[0] ?? null;
    const selectedSectionNumber = selectedSection
        ? sectionOutline.findIndex((section) => section.id === selectedSection.id) + 1
        : 0;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characterCount = content.length;
    const latestCompliance = complianceResult
        ? {
              overallScore: complianceResult.overallScore,
              isValid: complianceResult.isValid,
              issuesCount: complianceResult.issues.length,
              warningsCount: complianceResult.issues.filter((issue) => issue.type === "warning").length,
              suggestionsCount: complianceResult.issues.filter((issue) => issue.type === "suggestion").length,
              checkedAt: Date.now(),
          }
        : complianceHistory?.[0];

    const replaceSections = (nextSections: DraftSection[]) => {
        setSections(nextSections);
        setContent(composeDraftBodyFromSections(nextSections));

        if (!nextSections.some((section) => section.id === selectedSectionId)) {
            setSelectedSectionId(nextSections[0]?.id ?? "");
        }
    };

    const handleContentChange = (nextBody: string) => {
        setContent(nextBody);
        const nextSections = buildDraftSectionsFromBody(nextBody);
        setSections(nextSections);

        if (!nextSections.some((section) => section.id === selectedSectionId)) {
            setSelectedSectionId(nextSections[0]?.id ?? "");
        }
    };

    const handleSectionChange = (sectionId: string, field: "heading" | "body", value: string) => {
        const nextSections = sectionOutline.map((section) =>
            section.id === sectionId ? { ...section, [field]: value } : section,
        );
        replaceSections(nextSections);
    };

    const handleAddSection = () => {
        const nextSections = [...sectionOutline, createDraftSection(sectionOutline.length)];
        replaceSections(nextSections);
        setSelectedSectionId(nextSections[nextSections.length - 1]?.id ?? "");
    };

    const handleRemoveSection = (sectionId: string) => {
        const nextSections = sectionOutline.filter((section) => section.id !== sectionId);
        replaceSections(nextSections);
    };

    const handleSave = async () => {
        if (!draft) return;

        setIsSaving(true);
        setSaveSuccess(false);

        try {
            await updateDraft({
                id: draftId,
                title,
                content: updateDraftSectionsContent(
                    draft.content,
                    sections.length > 0 ? sections : buildDraftSectionsFromBody(content),
                ),
                status,
            });

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            toast.success("Draft saved.");
        } catch (error) {
            console.error("Failed to save draft:", error);
            toast.error("Failed to save draft. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCheckCompliance = async () => {
        if (!draft) return;

        setIsCheckingCompliance(true);
        setShowCompliance(true);

        try {
            const result = await checkCompliance({
                content,
                jurisdiction: draft.jurisdiction,
            });
            const normalizedResult = result as ComplianceResult;

            setComplianceResult(normalizedResult);

            await saveComplianceReport({
                draftId,
                draftVersion: draft.version,
                overallScore: normalizedResult.overallScore,
                isValid: normalizedResult.isValid,
                issues: normalizedResult.issues,
            });

            toast.success("Compliance report saved.");
        } catch (error) {
            console.error("Failed to check compliance:", error);
            toast.error("Failed to check compliance. Please try again.");
        } finally {
            setIsCheckingCompliance(false);
        }
    };

    if (draft === undefined) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-44 rounded-3xl" />
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
                    <Skeleton className="h-[720px] rounded-3xl" />
                    <Skeleton className="h-[720px] rounded-3xl" />
                </div>
            </div>
        );
    }

    if (draft === null) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/drafts">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Draft Not Found</h1>
                </div>
                <Card className="rounded-3xl">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            This draft does not exist or you do not have access.
                        </p>
                        <Button className="mt-4" asChild>
                            <Link href="/drafts">Back to Drafts</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <section className="space-y-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-4">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={cn("rounded-full border px-3 py-1", statusClasses[status] ?? statusClasses.DRAFT)}>
                                        {status}
                                    </Badge>
                                    {draft.aiGenerated ? (
                                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                            AI generated
                                        </Badge>
                                    ) : null}
                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                        v{draft.version}
                                    </Badge>
                                </div>

                                <div className="max-w-4xl">
                                    <Label htmlFor="draft-title" className="sr-only">
                                        Draft title
                                    </Label>
                                    <Input
                                        id="draft-title"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        className="h-auto border-0 bg-transparent px-0 text-3xl font-bold tracking-tight shadow-none focus-visible:ring-0"
                                    />
                                </div>

                                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Working draft for {draft.jurisdictionName}. Edit the full ordinance, tune section-level
                                    structure, then run compliance before export.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            {saveSuccess ? (
                                <div className="mr-1 flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Saved
                                </div>
                            ) : null}
                            <Button variant="outline" onClick={handleCheckCompliance} disabled={isCheckingCompliance}>
                                {isCheckingCompliance ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Shield className="mr-2 h-4 w-4" />
                                )}
                                Check compliance
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/export?draft=${draftId}`}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/drafts/${draftId}/preview`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Preview
                                </Link>
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save draft
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="Words"
                            value={wordCount.toLocaleString()}
                            detail={`${characterCount.toLocaleString()} characters`}
                        />
                        <MetricCard
                            label="Sections"
                            value={sectionOutline.length.toString()}
                            detail={
                                selectedSection ? `Focused on section ${selectedSectionNumber}` : "No structured sections yet"
                            }
                        />
                        <MetricCard
                            label="Compliance"
                            value={latestCompliance ? `${latestCompliance.overallScore}/100` : "Pending"}
                            detail={
                                latestCompliance
                                    ? `${latestCompliance.issuesCount} items in the latest review`
                                    : "Run the first compliance pass"
                            }
                        />
                        <MetricCard
                            label="Last updated"
                            value={new Date(draft.updatedAt).toLocaleDateString()}
                            detail={new Date(draft.updatedAt).toLocaleTimeString()}
                        />
                    </div>
            </section>

            {showCompliance && complianceResult ? (
                <ComplianceSummary
                    complianceResult={complianceResult}
                    isCheckingCompliance={isCheckingCompliance}
                    onRefresh={handleCheckCompliance}
                    onDismiss={() => setShowCompliance(false)}
                />
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <CardTitle className="text-xl">Draft studio</CardTitle>
                                    <CardDescription className="mt-1">
                                        Work in the full-text editor and keep the structured section view synced.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                        Full text + sections stay synced
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                        Best with formal headings
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="h-full">
                                <div className="flex h-full flex-col rounded-lg border bg-background">
                                    <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                                        <div>
                                            <div className="text-sm font-medium">Main ordinance body</div>
                                            <div className="text-xs text-muted-foreground">
                                                Write freely here. Headings are parsed into the outline automatically.
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                                            {wordCount.toLocaleString()} words
                                        </Badge>
                                    </div>
                                    <div className="flex-1 p-4">
                                        <Label htmlFor="content" className="sr-only">
                                            Draft content
                                        </Label>
                                        <Textarea
                                            id="content"
                                            value={content}
                                            onChange={(event) => handleContentChange(event.target.value)}
                                            rows={24}
                                            className="h-full min-h-[620px] resize-y border-0 bg-transparent px-0 py-0 font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
                                            placeholder="Start writing your ordinance here..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-full">
                                <div className="flex h-full flex-col rounded-lg border bg-background">
                                    <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                                        <div>
                                            <div className="text-sm font-medium">Live outline</div>
                                            <div className="text-xs text-muted-foreground">
                                                Jump between sections and expand the ordinance structure.
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleAddSection}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex min-h-[620px] flex-1 flex-col p-3">
                                        {sectionOutline.length === 0 ? (
                                            <div className="flex flex-1 items-center rounded-lg border border-dashed p-5 text-sm leading-6 text-muted-foreground">
                                                Add headings like &quot;SECTION 1. Title.&quot; or create a section here to
                                                start a structured outline.
                                            </div>
                                        ) : (
                                            <ScrollArea className="h-full flex-1 pr-3">
                                                <div className="space-y-3">
                                                    {sectionOutline.map((section, index) => (
                                                        <SectionListItem
                                                            key={section.id}
                                                            section={section}
                                                            index={index}
                                                            active={selectedSection?.id === section.id}
                                                            onSelect={setSelectedSectionId}
                                                        />
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <CardTitle className="text-xl">
                                        {selectedSection ? `Section ${selectedSectionNumber} editor` : "Section editor"}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Refine the selected section without losing alignment with the full ordinance text.
                                    </CardDescription>
                                </div>
                                {selectedSection ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveSection(selectedSection.id)}
                                        disabled={sectionOutline.length <= 1}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove section
                                    </Button>
                                ) : null}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {selectedSection ? (
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="section-heading">Section heading</Label>
                                            <Input
                                                id="section-heading"
                                                value={selectedSection.heading}
                                                onChange={(event) =>
                                                    handleSectionChange(selectedSection.id, "heading", event.target.value)
                                                }
                                                className="h-12 text-base font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="section-body">Section body</Label>
                                            <Textarea
                                                id="section-body"
                                                value={selectedSection.body}
                                                onChange={(event) =>
                                                    handleSectionChange(selectedSection.id, "body", event.target.value)
                                                }
                                                rows={14}
                                                className="min-h-[320px] font-mono text-sm leading-7"
                                                placeholder="Write the text for this section..."
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <div className="text-xs font-medium text-muted-foreground">
                                            Section snapshot
                                        </div>
                                        <div className="mt-3 text-lg font-semibold leading-tight">
                                            {selectedSection.heading || "Untitled section"}
                                        </div>
                                        <Separator className="my-4" />
                                        <div className="space-y-3 text-sm text-muted-foreground">
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Word count</span>
                                                <span className="font-medium text-foreground">
                                                    {selectedSection.body.trim()
                                                        ? selectedSection.body.trim().split(/\s+/).length
                                                        : 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Characters</span>
                                                <span className="font-medium text-foreground">
                                                    {selectedSection.body.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Position</span>
                                                <span className="font-medium text-foreground">
                                                    Section {selectedSectionNumber} of {sectionOutline.length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-5 rounded-lg border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground">
                                            Editing here updates the full text editor above immediately. Use this panel for
                                            focused revision, then save the draft when the language is final.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-8 text-sm leading-6 text-muted-foreground">
                                    Select or create a section to begin structured editing.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <SidePanelCard title="Workflow" description="Keep the draft status and context accurate before review.">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label htmlFor="draft-status">Draft status</Label>
                                    <Badge className={cn("border px-3 py-1", statusClasses[status] ?? statusClasses.DRAFT)}>
                                        {status}
                                    </Badge>
                                </div>
                                <Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus)}>
                                    <SelectTrigger id="draft-status" className="h-11 w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Jurisdiction</span>
                                        <span className="font-medium capitalize">{draft.jurisdiction}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-muted-foreground">Office</span>
                                        <span className="max-w-[180px] text-right font-medium">{draft.jurisdictionName}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Created</span>
                                        <span className="font-medium">{new Date(draft.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Updated</span>
                                        <span className="font-medium">{new Date(draft.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SidePanelCard>

                    <SidePanelCard title="Compliance pulse" description="Recent quality and compliance signals for this draft.">
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="flex items-end justify-between gap-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Latest score</div>
                                        <div className="mt-1 text-3xl font-semibold tracking-tight">
                                            {latestCompliance ? `${latestCompliance.overallScore}/100` : "--"}
                                        </div>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "rounded-full border px-3 py-1",
                                            latestCompliance?.isValid
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-amber-200 bg-amber-50 text-amber-700",
                                        )}
                                    >
                                        {latestCompliance?.isValid ? "Compliant" : "Needs review"}
                                    </Badge>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-lg bg-background px-2 py-3">
                                        <div className="text-lg font-semibold">{latestCompliance?.issuesCount ?? 0}</div>
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                            Issues
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-background px-2 py-3">
                                        <div className="text-lg font-semibold">{latestCompliance?.warningsCount ?? 0}</div>
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                            Warnings
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-background px-2 py-3">
                                        <div className="text-lg font-semibold">{latestCompliance?.suggestionsCount ?? 0}</div>
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                            Tips
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {complianceHistory === undefined ? (
                                <Skeleton className="h-28 rounded-2xl" />
                            ) : complianceHistory.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    No compliance checks saved yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {complianceHistory.map((report) => (
                                        <div key={report._id} className="rounded-lg border p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="font-medium">Version {report.draftVersion}</div>
                                                <Badge variant={report.isValid ? "default" : "secondary"}>
                                                    {report.isValid ? "Compliant" : "Needs review"}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {new Date(report.checkedAt).toLocaleString()}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                <Badge variant="outline">{report.overallScore}/100</Badge>
                                                <Badge variant="outline">{report.issuesCount} issues</Badge>
                                                <Badge variant="outline">{report.warningsCount} warnings</Badge>
                                                <Badge variant="outline">{report.suggestionsCount} tips</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SidePanelCard>

                    <SidePanelCard title="Version trail" description="Recent saved states and related actions.">
                        <div className="space-y-4">
                            {versionHistory === undefined ? (
                                <Skeleton className="h-28 rounded-2xl" />
                            ) : versionHistory.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    No saved revisions yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {versionHistory.slice(0, 4).map((version) => (
                                        <div key={version._id} className="rounded-lg border p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="font-medium">
                                                    v{version.version} {version.isCurrent ? "Current" : ""}
                                                </div>
                                                <Badge variant={version.isCurrent ? "default" : "outline"}>
                                                    {version.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {new Date(version.updatedAt).toLocaleString()}
                                            </div>
                                            {version.commitMessage ? (
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    {version.commitMessage}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-between" asChild>
                                    <Link href={`/drafts/${draftId}/preview`}>
                                        Preview draft
                                        <FileText className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-between" asChild>
                                    <Link href={`/compare?draft=${draftId}`}>
                                        Compare versions
                                        <FileText className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-between" asChild>
                                    <Link href="/ai">
                                        Open AI drafting
                                        <Sparkles className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-between" asChild>
                                    <Link href="/templates">
                                        Browse templates
                                        <FileText className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </SidePanelCard>
                </div>
            </div>
        </div>
    );
}
