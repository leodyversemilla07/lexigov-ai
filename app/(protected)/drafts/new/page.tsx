"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import Link from "next/link";
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

export default function NewDraftPage() {
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

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4 pl-0">
                    <Link href="/drafts">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Drafts
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Create New Draft</h1>
                <p className="text-muted-foreground mt-1">
                    Start drafting a new ordinance or use AI to generate one
                </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="cursor-pointer border-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                    <CardContent className="p-6">
                        <Sparkles className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-semibold mb-1">AI Generate</h3>
                        <p className="text-sm text-muted-foreground">
                            Let AI create a draft based on your requirements
                        </p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-6">
                        <FileText className="w-8 h-8 text-muted-foreground mb-3" />
                        <h3 className="font-semibold mb-1">Manual Draft</h3>
                        <p className="text-sm text-muted-foreground">
                            Start from scratch with a blank template
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="p-6 space-y-6">
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

                        <div className="grid grid-cols-2 gap-4">
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
                                {isSubmitting ? "Creating..." : "Create Draft"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
