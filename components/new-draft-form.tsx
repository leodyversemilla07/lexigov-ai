"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Controller } from "react-hook-form";
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
import { useZodForm } from "@/hooks/use-zod-form";
import { draftComposerSchema } from "@/lib/schemas/draft";

const documentTypes = [
    { value: "ORDINANCE", label: "Ordinance" },
    { value: "RESOLUTION", label: "Resolution" },
    { value: "MEMORANDUM", label: "Memorandum" },
    { value: "POLICY", label: "Policy" },
];

const jurisdictions = [
    { value: "barangay", label: "Barangay", penalty: "Fine up to P1,000 or community service" },
    { value: "city", label: "City", penalty: "Fine up to P10,000" },
    { value: "municipal", label: "Municipal", penalty: "Fine up to P5,000" },
    { value: "provincial", label: "Provincial", penalty: "Fine up to P20,000" },
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
    const [initialContent, setInitialContent] = useState("");
    const form = useZodForm({
        schema: draftComposerSchema,
        defaultValues: {
            title: "",
            documentType: "ORDINANCE",
            jurisdiction: "barangay",
            jurisdictionName: "",
        },
        mode: "onBlur",
        reValidateMode: "onChange",
    });
    const {
        control,
        formState: { errors, isSubmitting },
        getValues,
        handleSubmit,
        register,
        setValue,
        watch,
    } = form;
    const formData = watch();
    const templateId = searchParams.get("template");
    const selectedTemplate = useQuery(
        api.templates.get,
        templateId ? { id: templateId as Id<"templates"> } : "skip",
    ) as TemplateData | null | undefined;
    const lastAppliedTemplateId = useRef<string | null>(null);
    const lastSuggestedContent = useRef("");
    const selectedPenalty = jurisdictions.find((item) => item.value === formData.jurisdiction)?.penalty;

    useEffect(() => {
        if (!selectedTemplate || lastAppliedTemplateId.current === selectedTemplate._id) {
            return;
        }

        lastAppliedTemplateId.current = selectedTemplate._id;
        setValue("title", selectedTemplate.name, { shouldValidate: true });
        setValue("documentType", getTemplateDocumentType(selectedTemplate), {
            shouldValidate: true,
        });
        setValue(
            "jurisdiction",
            getTemplateJurisdiction(selectedTemplate) ?? getValues("jurisdiction"),
            { shouldValidate: true },
        );
    }, [getValues, selectedTemplate, setValue]);

    useEffect(() => {
        if (!selectedTemplate) {
            lastSuggestedContent.current = "";
            return;
        }

        const suggestedContent = getTemplateBody(
            selectedTemplate,
            formData.jurisdictionName,
            selectedPenalty,
        );

        setInitialContent((current) => {
            const shouldReplace = !current.trim() || current === lastSuggestedContent.current;
            lastSuggestedContent.current = suggestedContent;
            return shouldReplace ? suggestedContent : current;
        });
    }, [formData.jurisdictionName, selectedPenalty, selectedTemplate]);

    const onSubmit = handleSubmit(async (values) => {
        try {
            const content = initialContent.trim()
                ? normalizeDraftContent({ body: initialContent.trim() })
                : undefined;
            const draftId = await createDraft({
                ...values,
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
        }
    });

    const formFields = (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Barangay Curfew Ordinance 2024"
                    {...register("title")}
                />
                {errors.title ? (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Document Type *</Label>
                    <Controller
                        control={control}
                        name="documentType"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
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
                        )}
                    />
                    {errors.documentType ? (
                        <p className="text-sm text-destructive">{errors.documentType.message}</p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label>Jurisdiction Level *</Label>
                    <Controller
                        control={control}
                        name="jurisdiction"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
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
                        )}
                    />
                    {errors.jurisdiction ? (
                        <p className="text-sm text-destructive">{errors.jurisdiction.message}</p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="jurisdictionName">Jurisdiction Name *</Label>
                <Input
                    id="jurisdictionName"
                    type="text"
                    placeholder="e.g., Barangay San Roque, City of Manila"
                    {...register("jurisdictionName")}
                />
                {errors.jurisdictionName ? (
                    <p className="text-sm text-destructive">{errors.jurisdictionName.message}</p>
                ) : null}
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
        <form onSubmit={onSubmit}>
            {wrapped ? <Card><CardContent className="p-6">{formFields}</CardContent></Card> : formFields}
        </form>
    );
}
