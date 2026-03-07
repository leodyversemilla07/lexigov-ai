"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

type DraftComposerFormProps = {
    wrapped?: boolean;
    submitLabel?: string;
};

export function DraftComposerForm({
    wrapped = true,
    submitLabel = "Create Draft",
}: DraftComposerFormProps) {
    const router = useRouter();
    const createDraft = useMutation(api.drafts.create);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        documentType: "ORDINANCE",
        jurisdiction: "BARANGAY",
        jurisdictionName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const draftId = await createDraft(formData);
            router.push(`/drafts/${draftId}`);
        } catch (error) {
            console.error("Failed to create draft:", error);
            alert("Failed to create draft. Please try again.");
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
