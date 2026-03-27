"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    getTemplateBody,
    getTemplateDescription,
    getTemplateDocumentType,
    getTemplateJurisdiction,
    type TemplateData,
} from "@/lib/template-utils";
import { normalizeDraftContent } from "@/lib/draft-content";

const documentTypes = [
    { value: "ORDINANCE", label: "Ordinance" },
    { value: "RESOLUTION", label: "Resolution" },
    { value: "MEMORANDUM", label: "Memorandum" },
    { value: "POLICY", label: "Policy" },
];

const jurisdictions = [
    { value: "barangay", label: "Barangay" },
    { value: "city", label: "City" },
    { value: "municipal", label: "Municipal" },
    { value: "provincial", label: "Provincial" },
];

type DraftComposerFormProps = {
    wrapped?: boolean;
    submitLabel?: string;
};

export function DraftComposerForm({
    wrapped = true,
    submitLabel = "Create Draft",
}: DraftComposerFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const createDraft = useMutation(api.drafts.create);
    const incrementTemplateUsage = useMutation(api.templates.incrementUsage);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialContent, setInitialContent] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        documentType: "ORDINANCE",
        jurisdiction: "barangay",
        jurisdictionName: "",
    });
    const templateId = searchParams.get("template");
    const selectedTemplate = useQuery(
        api.templates.get,
        templateId ? { id: templateId as Id<"templates"> } : "skip",
    ) as TemplateData | null | undefined;
    const lastAppliedTemplateId = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedTemplate || lastAppliedTemplateId.current === selectedTemplate._id) {
            return;
        }

        lastAppliedTemplateId.current = selectedTemplate._id;
        setFormData((current) => ({
            ...current,
            title: selectedTemplate.name,
            documentType: getTemplateDocumentType(selectedTemplate),
            jurisdiction: getTemplateJurisdiction(selectedTemplate) ?? current.jurisdiction,
        }));
        setInitialContent(getTemplateBody(selectedTemplate, ""));
    }, [selectedTemplate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const content = initialContent.trim() ? normalizeDraftContent({ body: initialContent.trim() }) : undefined;
            const draftId = await createDraft({
                ...formData,
                content,
                templateId: selectedTemplate?._id as Id<"templates"> | undefined,
            });
            if (selectedTemplate) {
                await incrementTemplateUsage({ id: selectedTemplate._id as Id<"templates"> });
            }
            router.push(`/drafts/${draftId}`);
        } catch (error) {
            console.error("Failed to create draft:", error);
            toast.error("Failed to create draft. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formFields = (
        <div className="space-y-6">
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

            {selectedTemplate && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                    <div className="font-medium">Using saved template: {selectedTemplate.name}</div>
                    <p className="text-muted-foreground mt-1">{getTemplateDescription(selectedTemplate)}</p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="initialContent">Initial Content</Label>
                <Textarea
                    id="initialContent"
                    value={initialContent}
                    onChange={(e) => setInitialContent(e.target.value)}
                    rows={12}
                    placeholder="Optional starter content for the draft editor"
                    className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                    Saved templates can prefill this content before the draft opens in the editor.
                </p>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
                <Button variant="outline" asChild>
                    <Link href="/drafts">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : submitLabel}
                </Button>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit}>
            {wrapped ? <Card><CardContent className="p-6">{formFields}</CardContent></Card> : formFields}
        </form>
    );
}
