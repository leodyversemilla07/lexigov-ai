"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Save, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function DraftEditorPage() {
    const params = useParams();
    const router = useRouter();
    const draftId = params.id as Id<"drafts">;

    const draft = useQuery(api.drafts.get, { id: draftId });
    const updateDraft = useMutation(api.drafts.update);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (draft) {
            setTitle(draft.title);
            setContent(
                typeof draft.content === "string"
                    ? draft.content
                    : draft.content?.body ?? draft.content?.description ?? ""
            );
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
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } finally {
            setIsSaving(false);
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
                        <p className="text-muted-foreground">{draft.documentType}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {saveSuccess && (
                        <span className="flex items-center text-sm text-green-600">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Saved
                        </span>
                    )}
                    <Button variant="outline" disabled>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Assist
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

            {/* Editor */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={20}
                                    className="font-mono text-sm"
                                    placeholder="Start writing your ordinance here..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Draft Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge
                                    variant={draft.status === "FINAL" ? "default" : "secondary"}
                                    className={cn(draft.status === "FINAL" && "bg-green-100 text-green-800 hover:bg-green-100")}
                                >
                                    {draft.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Jurisdiction</span>
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
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/compliance">Run Compliance Check</Link>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/export">Export Draft</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}