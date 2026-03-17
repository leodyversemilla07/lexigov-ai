"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Download, FileText, File, Loader2, CheckCircle, ChevronRight, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const exportFormats = [
    {
        id: "txt",
        name: "Plain Text",
        description: "Export as .txt file",
        icon: FileText,
    },
    {
        id: "md",
        name: "Markdown",
        description: "Export as .md file for documentation",
        icon: FileType,
    },
    {
        id: "docx",
        name: "Word Document",
        description: "Export as .docx file (coming soon)",
        icon: File,
        disabled: true,
    },
];

interface Draft {
    _id: string;
    title: string;
    documentType: string;
    jurisdiction: string;
    jurisdictionName: string;
    status: string;
    content: unknown;
    updatedAt: number;
}

function ExportPageContent() {
    const searchParams = useSearchParams();
    const initialDraftId = searchParams.get("draft");
    
    const drafts = useQuery(api.drafts.list, {});
    const exportDraft = useMutation(api.drafts.exportDraft);

    const [selectedDraftId, setSelectedDraftId] = useState<string>(initialDraftId || "");
    const [selectedFormat, setSelectedFormat] = useState<string>("txt");
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [previewContent, setPreviewContent] = useState<string>("");
    const [showPreview, setShowPreview] = useState(false);

    const selectedDraft = drafts?.find((d: Draft) => d._id === selectedDraftId);

    const getContent = (draft: Draft): string => {
        if (!draft.content) return "";
        if (typeof draft.content === "string") return draft.content;
        return (draft.content as { body?: string }).body || "";
    };

    const handleExport = async () => {
        if (!selectedDraft || selectedFormat === "docx") return;
        
        setIsExporting(true);
        setExportSuccess(false);
        
        try {
            const result = await exportDraft({
                id: selectedDraft._id,
                format: selectedFormat as "txt" | "md" | "docx",
            });

            const blob = new Blob([result.content], { type: result.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to export:", error);
            alert("Failed to export draft. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePreview = () => {
        if (!selectedDraft) return;
        const content = getContent(selectedDraft);
        
        if (selectedFormat === "md") {
            setPreviewContent(`# ${selectedDraft.title}\n\n**Type:** ${selectedDraft.documentType}\n**Jurisdiction:** ${selectedDraft.jurisdictionName}\n\n---\n\n${content}`);
        } else {
            setPreviewContent(`${selectedDraft.documentType.toUpperCase()}\n${selectedDraft.title}\n${selectedDraft.jurisdictionName} (${selectedDraft.jurisdiction.toUpperCase()})\n${"=".repeat(50)}\n\n${content}`);
        }
        setShowPreview(true);
    };

    const isLoading = drafts === undefined;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Export</h1>
                <p className="text-muted-foreground">
                    Export your ordinance drafts in various formats
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Draft Selection */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Select Draft</CardTitle>
                            <CardDescription>
                                Choose a draft to export
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10" />
                                    <Skeleton className="h-10" />
                                </div>
                            ) : !drafts || drafts.length === 0 ? (
                                <div className="text-center py-4">
                                    <FileText className="h-8 w-8 mx-auto text-muted mb-2" />
                                    <p className="text-sm text-muted-foreground">No drafts found</p>
                                </div>
                            ) : (
                                <Select value={selectedDraftId} onValueChange={setSelectedDraftId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a draft" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drafts.map((draft: Draft) => (
                                            <SelectItem key={draft._id} value={draft._id}>
                                                <div className="truncate">
                                                    <div className="font-medium truncate">{draft.title}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {draft.documentType} • {new Date(draft.updatedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </CardContent>
                    </Card>

                    {selectedDraft && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Selected Draft</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <div className="font-medium">{selectedDraft.title}</div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <Badge variant="outline">{selectedDraft.documentType}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jurisdiction</span>
                                    <span className="capitalize">{selectedDraft.jurisdiction}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant="secondary">{selectedDraft.status}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span>{new Date(selectedDraft.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="pt-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        asChild
                                    >
                                        <Link href={`/drafts/${selectedDraft._id}`}>
                                            View Draft
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Format Selection & Preview */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Format Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Format</CardTitle>
                            <CardDescription>
                                Choose the format for your export
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                {exportFormats.map((format) => (
                                    <div
                                        key={format.id}
                                        className={cn(
                                            "cursor-pointer rounded-lg border-2 p-4 transition-all",
                                            selectedFormat === format.id 
                                                ? "border-primary bg-primary/5" 
                                                : format.disabled 
                                                    ? "border-muted opacity-50" 
                                                    : "border-muted hover:border-primary/50"
                                        )}
                                        onClick={() => !format.disabled && setSelectedFormat(format.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                selectedFormat === format.id ? "bg-primary/10" : "bg-muted"
                                            )}>
                                                <format.icon className={cn(
                                                    "h-5 w-5",
                                                    selectedFormat === format.id ? "text-primary" : "text-muted-foreground"
                                                )} />
                                            </div>
                                            <div>
                                                <div className="font-medium">{format.name}</div>
                                                <div className="text-xs text-muted-foreground">{format.description}</div>
                                            </div>
                                        </div>
                                        {format.disabled && (
                                            <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Export Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedDraft ? (
                                <>
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium">{selectedDraft.title}.{selectedFormat}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {getContent(selectedDraft).length} characters
                                                </div>
                                            </div>
                                        </div>
                                        {exportSuccess && (
                                            <Badge className="bg-green-100 text-green-800">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Exported
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline"
                                            onClick={handlePreview}
                                            disabled={!selectedDraft}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Preview
                                        </Button>
                                        <Button 
                                            onClick={handleExport}
                                            disabled={isExporting || selectedFormat === "docx" || !selectedDraft}
                                            className="flex-1"
                                        >
                                            {isExporting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Exporting...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Export {selectedFormat.toUpperCase()}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Select a draft to export
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview Modal */}
                    {showPreview && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Export Preview</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                                    Close
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                                    {previewContent}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function ExportLoading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                    <Card><CardContent className="p-6"><Skeleton className="h-40" /></CardContent></Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card><CardContent className="p-6"><Skeleton className="h-40" /></CardContent></Card>
                    <Card><CardContent className="p-6"><Skeleton className="h-60" /></CardContent></Card>
                </div>
            </div>
        </div>
    );
}

export default function ExportPage() {
    return (
        <Suspense fallback={<ExportLoading />}>
            <ExportPageContent />
        </Suspense>
    );
}
