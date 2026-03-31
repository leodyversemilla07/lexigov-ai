"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { extractDraftBody, extractDraftSections, normalizeDraftContent } from "@/lib/draft-content";
import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
    DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
    REVIEW: "border-sky-200 bg-sky-50 text-sky-800",
    FINAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
    ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};

function renderParagraphs(text: string) {
    return text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

export default function DraftPreviewPage() {
    const params = useParams();
    const draftId = params.id as Id<"drafts">;
    const draft = useQuery(api.drafts.get, { id: draftId });

    if (draft === undefined) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-32" />
                <Skeleton className="h-[720px]" />
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
                <Card>
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

    const normalizedContent = normalizeDraftContent(draft.content);
    const sections = normalizedContent.sections.length > 0
        ? normalizedContent.sections
        : extractDraftSections(draft.content);
    const body = extractDraftBody(draft.content);
    const introParagraphs = sections.length > 0 ? [] : renderParagraphs(body);

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" size="sm" className="-ml-3" asChild>
                            <Link href={`/drafts/${draftId}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to editor
                            </Link>
                        </Button>
                        <Badge className={cn("border px-3 py-1", statusClasses[draft.status] ?? statusClasses.DRAFT)}>
                            {draft.status}
                        </Badge>
                        <Badge variant="outline">v{draft.version}</Badge>
                        <Badge variant="outline">{draft.documentType}</Badge>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{draft.title}</h1>
                        <p className="mt-2 text-muted-foreground">
                            Clean reading view for {draft.jurisdictionName}.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/export?draft=${draftId}`}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/drafts/${draftId}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Edit Draft
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Draft Summary</CardTitle>
                    <CardDescription>Reference details for review and circulation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Jurisdiction</div>
                        <div className="mt-1 font-medium">{draft.jurisdictionName}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Level</div>
                        <div className="mt-1 font-medium capitalize">{draft.jurisdiction}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Updated</div>
                        <div className="mt-1 font-medium">{new Date(draft.updatedAt).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Sections</div>
                        <div className="mt-1 font-medium">{sections.length || renderParagraphs(body).length}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="px-6 py-10 sm:px-10 lg:px-14">
                    <article className="space-y-10">
                        <header className="space-y-4 border-b pb-8 text-center">
                            <div className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                {draft.documentType}
                            </div>
                            <h2 className="text-3xl font-bold leading-tight">{draft.title}</h2>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>{draft.jurisdictionName}</div>
                                <div>Last updated {new Date(draft.updatedAt).toLocaleDateString()}</div>
                            </div>
                            {normalizedContent.summary ? (
                                <p className="mx-auto max-w-3xl text-base leading-7 text-foreground/80">
                                    {normalizedContent.summary}
                                </p>
                            ) : null}
                        </header>

                        {sections.length > 0 ? (
                            <div className="space-y-10">
                                {sections.map((section, index) => (
                                    <section key={section.id} className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                Section {index + 1}
                                            </div>
                                            <h3 className="text-xl font-semibold leading-tight">{section.heading}</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {renderParagraphs(section.body).map((paragraph, paragraphIndex) => (
                                                <p
                                                    key={`${section.id}-${paragraphIndex}`}
                                                    className="text-base leading-8 text-foreground/90"
                                                >
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : introParagraphs.length > 0 ? (
                            <div className="space-y-5">
                                {introParagraphs.map((paragraph, index) => (
                                    <p key={index} className="text-base leading-8 text-foreground/90">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                This draft does not have content yet.
                            </div>
                        )}
                    </article>
                </CardContent>
            </Card>
        </div>
    );
}
