"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { Controller } from "react-hook-form";
import { WandSparkles, FileText, Clock, Loader2, ChevronRight, Sparkles, AlertCircle, CheckCircle2, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractDraftSections, normalizeDraftContent } from "@/lib/draft-content";
import { useZodForm } from "@/hooks/use-zod-form";
import { aiDraftFormSchema } from "@/lib/schemas/ai";
import {
    getTemplateDescription,
    getTemplateDocumentType,
    getTemplateJurisdiction,
    getTemplatePrompt,
    getTemplateSections,
    type TemplateData,
} from "@/lib/template-utils";

const documentTypes = [
    { value: "ORDINANCE", label: "Ordinance", description: "Formal legislative document requiring quorum and voting" },
    { value: "RESOLUTION", label: "Resolution", description: "Expression of sentiment or decision, simpler form" },
    { value: "MEMORANDUM", label: "Memorandum", description: "Internal directive or announcement" },
    { value: "POLICY", label: "Policy", description: "General guidelines and procedures" },
];

const jurisdictions = [
    { value: "barangay", label: "Barangay", penalty: "Fine up to ₱1,000 or community service" },
    { value: "municipal", label: "Municipal", penalty: "Fine up to ₱5,000" },
    { value: "city", label: "City", penalty: "Fine up to ₱10,000" },
    { value: "provincial", label: "Provincial", penalty: "Fine up to ₱20,000" },
];

const promptTemplates = [
    {
        id: "curfew",
        title: "Curfew Ordinance",
        prompt: `Create a curfew ordinance for [JURISDICTION] that:
- Establishes curfew hours from 10:00 PM to 5:00 AM for minors under 18
- Defines exceptions for emergencies, work, and school activities
- Sets penalty of [PENALTY] for violations
- Requires parental accompaniment for minors
- Includes separability and effectivity clauses`
    },
    {
        id: "noise",
        title: "Noise Control",
        prompt: `Create a noise control ordinance for [JURISDICTION] that:
- Prohibits excessive noise between 10:00 PM and 6:00 AM in residential areas
- Sets allowable decibel levels by zone (residential, commercial, industrial)
- Defines exceptions for celebrations, religious activities, and emergencies
- Establishes penalty of [PENALTY] for violations
- Authorizes barangay officials to enforce`
    },
    {
        id: "sanitation",
        title: "Sanitation & Waste Management",
        prompt: `Create a sanitation and waste management ordinance for [JURISDICTION] that:
- Mandates proper waste segregation at source
- Requires registration of garbage collectors and transport services
- Prohibits illegal dumping and burning of waste
- Sets penalty of [PENALTY] for violations
- Establishes a recycling program
- Requires businesses to have proper waste disposal contracts`
    },
    {
        id: "business",
        title: "Business Permit & Regulation",
        prompt: `Create a business permit and regulation ordinance for [JURISDICTION] that:
- Requires all businesses to obtain permits annually
- Sets requirements for specific business types (food, entertainment, construction)
- Establishes a business registration fee schedule
- Requires compliance with local zoning laws
- Sets penalty of [PENALTY] for unlicensed operations
- Includes provisions for renewal and revocation`
    },
    {
        id: "animals",
        title: "Animal Control",
        prompt: `Create an animal control ordinance for [JURISDICTION] that:
- Requires registration and vaccination of pets
- Prohibits roaming of unvaccinated or aggressive animals
- Establishes impoundment procedures for stray animals
- Sets penalties for owners of dangerous or nuisance animals
- Creates an animal shelter fund
- Includes provisions for spay/neuter programs`
    },
    {
        id: "custom",
        title: "Custom",
        prompt: ""
    }
];

function buildQuickTemplatePrompt(
    templateId: string,
    jurisdictionName: string,
    penalty?: string,
) {
    const template = promptTemplates.find((item) => item.id === templateId);
    if (!template || template.id === "custom") {
        return "";
    }

    return template.prompt
        .replace("[JURISDICTION]", jurisdictionName || "[Jurisdiction Name]")
        .replace("[PENALTY]", penalty || "[Penalty]");
}

function AIPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const generateOrdinance = useAction(api.ai.generateOrdinance);
    const createDraft = useMutation(api.drafts.create);
    const incrementTemplateUsage = useMutation(api.templates.incrementUsage);
    
    const [step, setStep] = useState<"configure" | "preview">("configure");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState(searchParams.get("template"));
    const form = useZodForm({
        schema: aiDraftFormSchema,
        defaultValues: {
            title: "",
            prompt: "",
            documentType: "ORDINANCE",
            jurisdiction: "barangay",
            jurisdictionName: "",
            quickTemplateId: "custom",
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
    const selectedSavedTemplate = useQuery(
        api.templates.get,
        selectedSavedTemplateId ? { id: selectedSavedTemplateId as Id<"templates"> } : "skip",
    ) as TemplateData | null | undefined;
    const lastAppliedSavedTemplateId = useRef<string | null>(null);
    const lastSuggestedPrompt = useRef("");

    const selectedDocType = documentTypes.find(d => d.value === formData.documentType);
    const selectedJurisdiction = jurisdictions.find(j => j.value === formData.jurisdiction);
    const templateSections = selectedSavedTemplate ? getTemplateSections(selectedSavedTemplate) : [];
    const generatedSections = generatedContent ? extractDraftSections({ body: generatedContent }) : [];

    useEffect(() => {
        if (!selectedSavedTemplate || lastAppliedSavedTemplateId.current === selectedSavedTemplate._id) {
            return;
        }

        lastAppliedSavedTemplateId.current = selectedSavedTemplate._id;
        const jurisdiction = getTemplateJurisdiction(selectedSavedTemplate) ?? getValues("jurisdiction");
        const penalty = jurisdictions.find((item) => item.value === jurisdiction)?.penalty;
        const prompt = getTemplatePrompt(
            selectedSavedTemplate,
            getValues("jurisdictionName"),
            penalty,
        );
        lastSuggestedPrompt.current = prompt;

        setValue("title", selectedSavedTemplate.name, { shouldValidate: true });
        setValue("documentType", getTemplateDocumentType(selectedSavedTemplate), {
            shouldValidate: true,
        });
        setValue("jurisdiction", jurisdiction, { shouldValidate: true });
        setValue("prompt", prompt, { shouldValidate: true });
        setValue("quickTemplateId", "custom");
    }, [getValues, selectedSavedTemplate, setValue]);

    useEffect(() => {
        if (!selectedSavedTemplate) {
            return;
        }

        const penalty = selectedJurisdiction?.penalty;
        const prompt = getTemplatePrompt(selectedSavedTemplate, formData.jurisdictionName, penalty);

        const currentPrompt = getValues("prompt");
        const shouldReplace =
            !currentPrompt.trim() || currentPrompt === lastSuggestedPrompt.current;
        lastSuggestedPrompt.current = prompt;
        if (shouldReplace) {
            setValue("prompt", prompt, { shouldValidate: true });
        }
    }, [
        formData.jurisdictionName,
        selectedJurisdiction?.penalty,
        selectedSavedTemplate,
        getValues,
        setValue,
    ]);

    useEffect(() => {
        if (selectedSavedTemplateId || formData.quickTemplateId === "custom") {
            return;
        }

        const prompt = buildQuickTemplatePrompt(
            formData.quickTemplateId,
            formData.jurisdictionName,
            selectedJurisdiction?.penalty,
        );

        const currentPrompt = getValues("prompt");
        const shouldReplace =
            !currentPrompt.trim() || currentPrompt === lastSuggestedPrompt.current;
        lastSuggestedPrompt.current = prompt;
        if (shouldReplace) {
            setValue("prompt", prompt, { shouldValidate: true });
        }
    }, [
        formData.jurisdictionName,
        formData.quickTemplateId,
        selectedJurisdiction?.penalty,
        selectedSavedTemplateId,
        getValues,
        setValue,
    ]);

    const handleQuickTemplateSelect = (templateId: string) => {
        const prompt = buildQuickTemplatePrompt(
            templateId,
            formData.jurisdictionName,
            selectedJurisdiction?.penalty,
        );

        if (templateId !== "custom") {
            lastSuggestedPrompt.current = prompt;
            setSelectedSavedTemplateId(null);
            setValue("quickTemplateId", templateId);
            setValue("prompt", prompt, { shouldValidate: true });
        } else {
            lastSuggestedPrompt.current = "";
            setSelectedSavedTemplateId(null);
            setValue("quickTemplateId", "custom");
            setValue("prompt", "", { shouldValidate: true });
        }
    };

    const handleGenerate = handleSubmit(async (values) => {
        setIsGenerating(true);
        try {
            const generated = await generateOrdinance({
                prompt: values.prompt,
                jurisdiction: values.jurisdiction,
                jurisdictionName: values.jurisdictionName,
                documentType: values.documentType,
            });
            setGeneratedContent(generated.content);
            setStep("preview");
        } catch (error) {
            console.error("Failed to generate:", error);
            toast.error("Failed to generate draft. Please check your configuration and try again.");
        } finally {
            setIsGenerating(false);
        }
    });

    const handleSaveDraft = async () => {
        if (!generatedContent) return;
        const values = getValues();
        
        try {
            const draftId = await createDraft({
                title: values.title,
                documentType: values.documentType,
                jurisdiction: values.jurisdiction,
                jurisdictionName: values.jurisdictionName,
                aiGenerated: true,
                templateId: selectedSavedTemplate?._id as Id<"templates"> | undefined,
                content: normalizeDraftContent({
                    body: generatedContent,
                    prompt: values.prompt,
                    generatedAt: Date.now(),
                    model: "gemini-1.5-flash",
                }),
            });
            if (selectedSavedTemplate) {
                await incrementTemplateUsage({ id: selectedSavedTemplate._id as Id<"templates"> });
            }
            router.push(`/drafts/${draftId}`);
        } catch (error) {
            console.error("Failed to create draft:", error);
            toast.error("Failed to save draft. Please try again.");
        }
    };

    const handleBackToConfigure = () => {
        setStep("configure");
        setGeneratedContent(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Generator</h1>
                    <p className="text-muted-foreground">
                        Create professional ordinances with AI assistance
                    </p>
                </div>
                <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Gemini 1.5 Flash
                </Badge>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                    step === "configure" ? "bg-primary text-primary-foreground" : "bg-green-100 text-green-700"
                )}>
                    {step === "configure" ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    Configure
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                    step === "preview" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                    <FileText className="h-4 w-4" />
                    Preview & Save
                </div>
            </div>

            {step === "configure" ? (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Document Configuration</CardTitle>
                                <CardDescription>
                                    Fill in the details for your ordinance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                                                                <div>
                                                                    <div className="font-medium">{type.label}</div>
                                                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                                                </div>
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
                                                                <div>
                                                                    <div className="font-medium">{j.label}</div>
                                                                    <div className="text-xs text-muted-foreground">{j.penalty}</div>
                                                                </div>
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

                                <div className="space-y-2">
                                    <Label htmlFor="prompt">Drafting Prompt *</Label>
                                    <Textarea
                                        id="prompt"
                                        rows={8}
                                        placeholder="Describe the ordinance you want to generate, including purpose, scope, restrictions, penalties, exceptions, and implementation details."
                                        className="font-mono text-sm"
                                        {...register("prompt")}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Be specific about requirements, penalties, exceptions, and enforcement
                                    </p>
                                    {errors.prompt ? (
                                        <p className="text-sm text-destructive">{errors.prompt.message}</p>
                                    ) : null}
                                </div>

                                <Button 
                                    onClick={handleGenerate} 
                                    disabled={isGenerating}
                                    className="w-full"
                                    size="lg"
                                    type="button"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <WandSparkles className="mr-2 h-4 w-4" />
                                            Generate Ordinance
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Templates Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Prompt Presets</CardTitle>
                                <CardDescription>
                                    Use local prompt starters when you are not generating from a saved template
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {promptTemplates.map((template) => (
                                    <Button
                                        key={template.id}
                                        variant={formData.quickTemplateId === template.id ? "secondary" : "ghost"}
                                        className="w-full justify-start text-left h-auto py-3"
                                        onClick={() => handleQuickTemplateSelect(template.id)}
                                    >
                                        <div>
                                            <div className="font-medium">{template.title}</div>
                                            {template.id !== "custom" && (
                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                    Click to apply template
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>

                        {selectedSavedTemplate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Saved Template</CardTitle>
                                    <CardDescription>
                                        This draft was started from the shared template library
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <div className="font-medium">{selectedSavedTemplate.name}</div>
                                        <p className="text-muted-foreground mt-1">
                                            {getTemplateDescription(selectedSavedTemplate)}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Template Section Backbone
                                        </div>
                                        {templateSections.length === 0 ? (
                                            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                                                This template does not define explicit sections yet.
                                            </div>
                                        ) : (
                                            templateSections.map((section, index) => (
                                                <div key={section.id} className="rounded-lg border p-3 text-xs">
                                                    <div className="font-medium">{section.heading}</div>
                                                    <div className="mt-1 text-muted-foreground">Section {index + 1}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setSelectedSavedTemplateId(null);
                                            lastSuggestedPrompt.current = "";
                                            setValue("quickTemplateId", "custom");
                                            setValue("prompt", "", { shouldValidate: true });
                                        }}
                                    >
                                        Use Custom Prompt Instead
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                                    <span>Include specific penalties within RA 7160 limits</span>
                                </div>
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                                    <span>Define enforcement mechanisms clearly</span>
                                </div>
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                                    <span>Include exceptions and exemptions</span>
                                </div>
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                                    <span>Add separability and effectivity clauses</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Generated Draft Preview</CardTitle>
                                    <CardDescription>
                                        Review the AI-generated content before saving
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    AI Generated
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px] rounded-md border p-4">
                                    <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm">
                                        {generatedContent}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Title</span>
                                    <span className="font-medium text-right max-w-[150px] truncate">{formData.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{selectedDocType?.label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jurisdiction</span>
                                    <span className="font-medium text-right max-w-[150px] truncate">{formData.jurisdictionName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Level</span>
                                    <span className="font-medium capitalize">{selectedJurisdiction?.label}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Next Steps</CardTitle>
                                <CardDescription>
                                    What would you like to do with this draft?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button 
                                    onClick={handleSaveDraft} 
                                    disabled={isSubmitting}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Save as Draft
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    <WandSparkles className="mr-2 h-4 w-4" />
                                    Regenerate
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="w-full"
                                    onClick={handleBackToConfigure}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Edit Configuration
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Generated Structure</CardTitle>
                                <CardDescription>
                                    Parsed section outline from the AI output
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {generatedSections.length === 0 ? (
                                    <p className="text-muted-foreground">
                                        The generated draft does not yet expose named sections.
                                    </p>
                                ) : (
                                    generatedSections.map((section, index) => (
                                        <div key={section.id} className="rounded-lg border p-3">
                                            <div className="font-medium">{section.heading}</div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Section {index + 1} • {section.body.length} characters
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

function AIPageLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-10 w-64 rounded-md bg-muted animate-pulse" />
                    <div className="h-5 w-80 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="h-8 w-36 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="h-12 w-64 rounded-full bg-muted animate-pulse" />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 h-[640px] rounded-xl bg-muted animate-pulse" />
                <div className="space-y-6">
                    <div className="h-56 rounded-xl bg-muted animate-pulse" />
                    <div className="h-48 rounded-xl bg-muted animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export default function AIPage() {
    return (
        <Suspense fallback={<AIPageLoading />}>
            <AIPageContent />
        </Suspense>
    );
}
