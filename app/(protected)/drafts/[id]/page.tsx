"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Save, Sparkles, CheckCircle, CheckCircle2, XCircle, Loader2, Shield, Download, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
    { value: "DRAFT", label: "Draft", description: "Work in progress" },
    { value: "REVIEW", label: "Review", description: "Under review" },
    { value: "FINAL", label: "Final", description: "Approved and final" },
    { value: "ARCHIVED", label: "Archived", description: "Archived" },
];

export default function DraftEditorPage() {
    const params = useParams();
    const draftId = params.id as Id<"drafts">;

    const draft = useQuery(api.drafts.get, { id: draftId });
    const updateDraft = useMutation(api.drafts.update);
    const checkCompliance = useAction(api.ai.checkCompliance);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
    const [showCompliance, setShowCompliance] = useState(false);
    const [status, setStatus] = useState("DRAFT");

    useEffect(() => {
        if (draft) {
            setTitle(draft.title);
            setContent(
                typeof draft.content === "string"
                    ? draft.content
                    : draft.content?.body ?? draft.content?.description ?? ""
            );
            setStatus(draft.status);
        }
    }, [draft]);

    const handleSave = async () => {
        if (!draft) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            await updateDraft({
                id: draftId,
                title,
                content: { ...draft.content, body: content },
                status,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
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
            setComplianceResult(result as ComplianceResult);
        } catch (error) {
            console.error("Failed to check compliance:", error);
            alert("Failed to check compliance. Please try again.");
        } finally {
            setIsCheckingCompliance(false);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "DRAFT": return "bg-yellow-100 text-yellow-800";
            case "REVIEW": return "bg-blue-100 text-blue-800";
            case "FINAL": return "bg-green-100 text-green-800";
            case "ARCHIVED": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (draft === undefined) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96" />
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
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">This draft does not exist or you do not have access.</p>
                        <Button className="mt-4" asChild>
                            <Link href="/drafts">Back to Drafts</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/drafts">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Draft</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            {draft.documentType} • {draft.jurisdictionName}
                            {draft.aiGenerated && <Badge variant="secondary" className="ml-2">AI Generated</Badge>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {saveSuccess && (
                        <span className="flex items-center text-sm text-green-600">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Saved
                        </span>
                    )}
                    <Button 
                        variant="outline" 
                        onClick={handleCheckCompliance}
                        disabled={isCheckingCompliance}
                    >
                        {isCheckingCompliance ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Shield className="mr-2 h-4 w-4" />
                        )}
                        Check Compliance
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/export?draft=${draftId}`}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Link>
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Compliance Results */}
            {showCompliance && complianceResult && (
                <Card className={cn(
                    "border-2",
                    complianceResult.isValid ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            {complianceResult.isValid ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                            )}
                            <div>
                                <CardTitle className="text-base">
                                    RA 7160 Compliance Check
                                </CardTitle>
                                <CardDescription>
                                    Overall Score: {complianceResult.overallScore}/100
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCheckCompliance}
                                disabled={isCheckingCompliance}
                            >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Re-check
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowCompliance(false)}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {complianceResult.issues.length === 0 ? (
                            <p className="text-green-700">No compliance issues found!</p>
                        ) : (
                            <div className="space-y-3">
                                {complianceResult.issues.map((issue, i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "p-3 rounded-lg",
                                            issue.type === "critical" ? "bg-red-100 border-l-4 border-red-500" :
                                            issue.type === "warning" ? "bg-yellow-100 border-l-4 border-yellow-500" :
                                            "bg-blue-100 border-l-4 border-blue-500"
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            {issue.type === "critical" ? (
                                                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                            ) : issue.type === "warning" ? (
                                                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium">{issue.title}</div>
                                                <div className="text-sm text-muted-foreground">{issue.description}</div>
                                                {issue.suggestion && (
                                                    <div className="text-sm mt-1 p-2 bg-white/50 rounded">
                                                        <span className="font-medium">Suggestion:</span> {issue.suggestion}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Editor */}
            <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ordinance Content</CardTitle>
                            <CardDescription>Write or edit your ordinance draft content</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-lg font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={25}
                                    className="font-mono text-sm min-h-[500px]"
                                    placeholder="Start writing your ordinance here..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            <div>
                                                <div className="font-medium">{s.label}</div>
                                                <div className="text-xs text-muted-foreground">{s.description}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Draft Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className={getStatusColor(status)}>
                                    {status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Jurisdiction</span>
                                <span className="font-medium capitalize">{draft.jurisdiction}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Level</span>
                                <span className="font-medium">{draft.jurisdictionName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Version</span>
                                <span className="font-medium">v{draft.version}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span className="font-medium">{new Date(draft.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Updated</span>
                                <span className="font-medium">{new Date(draft.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/ai">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    AI Assist
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/templates">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Use Template
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="/compliance">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Full Compliance
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
