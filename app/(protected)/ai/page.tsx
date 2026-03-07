"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { WandSparkles, FileText, Clock, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const documentTypes = [
    { value: "ORDINANCE", label: "Ordinance" },
    { value: "RESOLUTION", label: "Resolution" },
    { value: "MEMORANDUM", label: "Memorandum" },
    { value: "POLICY", label: "Policy" },
];

const jurisdictions = [
    { value: "BARANGAY", label: "Barangay" },
    { value: "CITY", label: "City" },
    { value: "MUNICIPAL", label: "Municipal" },
    { value: "PROVINCIAL", label: "Provincial" },
];

export default function AIPage() {
    const router = useRouter();
    const generateOrdinance = useAction(api.ai.generateOrdinance);
    const createDraft = useMutation(api.drafts.create);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        prompt: "",
        documentType: "ORDINANCE",
        jurisdiction: "BARANGAY",
        jurisdictionName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const generated = await generateOrdinance({
                prompt: formData.prompt,
                jurisdiction: formData.jurisdiction,
                jurisdictionName: formData.jurisdictionName,
                documentType: formData.documentType,
            });

            const draftId = await createDraft({
                title: formData.title,
                documentType: formData.documentType,
                jurisdiction: formData.jurisdiction,
                jurisdictionName: formData.jurisdictionName,
                aiGenerated: true,
                content: {
                    body: generated.content,
                    prompt: formData.prompt,
                    generatedAt: generated.generatedAt,
                    model: generated.model,
                },
            });

            router.push(`/drafts/${draftId}`);
        } catch (error) {
            console.error("Failed to generate AI draft:", error);
            alert("Failed to generate AI draft. Please check configuration and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Generator</h1>
                <p className="text-muted-foreground">
                    Start a new ordinance draft with AI-assisted setup and drafting inputs
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardDescription>Generation Mode</CardDescription>
                        <WandSparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AI First</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardDescription>Output Types</CardDescription>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardDescription>Typical Setup</CardDescription>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Under 1 min</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Draft Configuration</CardTitle>
                    <CardDescription>
                        Describe what you want to draft and AI will generate the initial ordinance content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Document Title *</Label>
                            <Input
                                id="title"
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Barangay Curfew Ordinance 2024"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Document Type *</Label>
                                <Select
                                    value={formData.documentType}
                                    onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Jurisdiction Level *</Label>
                                <Select
                                    value={formData.jurisdiction}
                                    onValueChange={(value) => setFormData({ ...formData, jurisdiction: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jurisdictions.map((j) => (
                                            <SelectItem key={j.value} value={j.value}>
                                                {j.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jurisdictionName">Jurisdiction Name *</Label>
                            <Input
                                id="jurisdictionName"
                                type="text"
                                required
                                value={formData.jurisdictionName}
                                onChange={(e) => setFormData({ ...formData, jurisdictionName: e.target.value })}
                                placeholder="e.g., Barangay San Roque, City of Manila"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prompt">Drafting Prompt *</Label>
                            <Textarea
                                id="prompt"
                                required
                                rows={8}
                                value={formData.prompt}
                                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                placeholder="Describe the ordinance you want to generate, including purpose, scope, restrictions, penalties, exceptions, and implementation details."
                            />
                        </div>

                        <div className="flex items-center justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Start AI Draft"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
