import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
    documentStatusValues,
    documentTypeValues,
    jurisdictionLevelValues,
} from '@lexigov/shared';
import {
    aiDraftFormSchema,
    changePasswordSchema,
    complianceCheckSchema,
    createDraftSchema,
    createTemplateSchema,
    draftComposerSchema,
    generateOrdinanceSchema,
    generateSummarySchema,
    loginSchema,
    ordinanceGenerationParamsSchema,
    registerSchema,
    suggestReferencesSchema,
    templateCategoryValues,
    templateEditorSchema,
    templateQuerySchema,
    updateProfileSchema,
    updateTemplateSchema,
    updateDraftSchema,
} from '@lexigov/shared';

describe("shared schema enums", () => {
    it("exposes the document, jurisdiction, and status contracts used by the app", () => {
        expect(documentTypeValues).toEqual(["ORDINANCE", "RESOLUTION", "MEMORANDUM", "POLICY"]);
        expect(jurisdictionLevelValues).toEqual(["barangay", "city", "municipal", "provincial"]);
        expect(documentStatusValues).toContain("DRAFT");
        expect(documentStatusValues).toContain("REVIEW");
        expect(documentStatusValues).toContain("FINAL");
        expect(documentStatusValues).toContain("ARCHIVED");
        expect(documentStatusValues).toContain("FIRST_READING");
        expect(documentStatusValues).toContain("SANGGUNIAN_ENACTED");
        expect(templateCategoryValues).toContain("Public Safety");
    });
});

describe("createDraftSchema", () => {
    it("accepts valid draft payloads", () => {
        const parsed = createDraftSchema.parse({
            title: "Barangay Curfew Ordinance 2026",
            documentType: "ORDINANCE",
            jurisdiction: "barangay",
            jurisdictionName: "Barangay San Roque",
            content: { body: "SECTION 1. Title." },
        });

        expect(parsed.documentType).toBe("ORDINANCE");
    });

    it("rejects titles that are too short", () => {
        expect(() =>
            createDraftSchema.parse({
                title: "Test",
                documentType: "ORDINANCE",
                jurisdiction: "barangay",
                jurisdictionName: "Barangay San Roque",
            }),
        ).toThrow(ZodError);
    });
});

describe("draftComposerSchema", () => {
    it("matches the manual draft form contract", () => {
        expect(
            draftComposerSchema.parse({
                title: "Barangay Curfew Ordinance 2026",
                documentType: "ORDINANCE",
                jurisdiction: "barangay",
                jurisdictionName: "Barangay San Roque",
            }).title,
        ).toBe("Barangay Curfew Ordinance 2026");
    });
});

describe("updateDraftSchema", () => {
    it("requires a positive concurrency version and accepts only valid workflow statuses", () => {
        expect(updateDraftSchema.parse({ status: "REVIEW", expectedVersion: 3 }).status).toBe("REVIEW");
        expect(() => updateDraftSchema.parse({ status: "REVIEW" })).toThrow(ZodError);
        expect(() => updateDraftSchema.parse({ status: "PUBLISHED", expectedVersion: 3 })).toThrow(ZodError);
    });
});

describe("template schemas", () => {
    it("requires a known category and at least one jurisdiction when creating", () => {
        expect(
            createTemplateSchema.parse({
                name: "Barangay Curfew Template",
                category: "Public Safety",
                jurisdiction: ["barangay"],
                structure: { body: "SECTION 1. Title." },
            }).category,
        ).toBe("Public Safety");

        expect(() =>
            createTemplateSchema.parse({
                name: "Barangay Curfew Template",
                category: "Unknown",
                jurisdiction: ["barangay"],
                structure: { body: "SECTION 1. Title." },
            }),
        ).toThrow(ZodError);

        expect(() =>
            createTemplateSchema.parse({
                name: "Barangay Curfew Template",
                category: "Public Safety",
                jurisdiction: [],
                structure: { body: "SECTION 1. Title." },
            }),
        ).toThrow(ZodError);
    });

    it("rejects invalid categories on update", () => {
        expect(() => updateTemplateSchema.parse({ category: "Unknown" })).toThrow(ZodError);
        expect(updateTemplateSchema.parse({ category: "Environment" }).category).toBe("Environment");
    });

    it("validates the template editor form state", () => {
        expect(
            templateEditorSchema.parse({
                name: "Barangay Curfew Template",
                category: "Public Safety",
                subcategory: "Youth safety",
                documentType: "ORDINANCE",
                jurisdictions: ["barangay", "city"],
                description: "Used for curfew enforcement.",
                prompt: "Generate an ordinance with penalties and exceptions.",
                body: "SECTION 1. Title.",
                visibility: "private",
            }).visibility,
        ).toBe("private");
    });
});

describe("aiDraftFormSchema", () => {
    it("extends AI generation validation with title and quick template state", () => {
        expect(
            aiDraftFormSchema.parse({
                title: "Barangay Curfew Ordinance 2026",
                prompt: "Create a curfew ordinance with penalties, exemptions, and enforcement details.",
                documentType: "ORDINANCE",
                jurisdiction: "barangay",
                jurisdictionName: "Barangay San Roque",
                quickTemplateId: "curfew",
            }).quickTemplateId,
        ).toBe("curfew");
    });
});

describe("generateOrdinanceSchema", () => {
    const valid = {
        prompt: "Create a curfew ordinance with penalties, exemptions, and enforcement details.",
        jurisdiction: "barangay" as const,
        jurisdictionName: "Barangay San Roque",
        documentType: "ORDINANCE" as const,
    };

    it("accepts a valid generate-ordinance payload", () => {
        const parsed = generateOrdinanceSchema.parse(valid);
        expect(parsed.prompt).toBe(valid.prompt);
    });

    it("rejects prompts shorter than 10 characters", () => {
        expect(() => generateOrdinanceSchema.parse({ ...valid, prompt: "short" })).toThrow(ZodError);
        expect(() => generateOrdinanceSchema.parse({ ...valid, prompt: "" })).toThrow(ZodError);
    });

    it("rejects prompts longer than 5000 characters", () => {
        expect(() => generateOrdinanceSchema.parse({ ...valid, prompt: "a".repeat(5001) })).toThrow(ZodError);
    });

    it("requires a known jurisdiction and document type", () => {
        expect(() => generateOrdinanceSchema.parse({ ...valid, jurisdiction: "national" })).toThrow(ZodError);
        expect(() => generateOrdinanceSchema.parse({ ...valid, documentType: "BILL" })).toThrow(ZodError);
    });

    it("accepts an optional templateId of at least 1 character", () => {
        expect(generateOrdinanceSchema.parse({ ...valid, templateId: "t1" }).templateId).toBe("t1");
        expect(() => generateOrdinanceSchema.parse({ ...valid, templateId: "" })).toThrow(ZodError);
    });
});

describe("complianceCheckSchema", () => {
    it("requires non-empty content and a known jurisdiction", () => {
        expect(
            complianceCheckSchema.parse({ content: "Some draft", jurisdiction: "city" }).jurisdiction,
        ).toBe("city");
        expect(() => complianceCheckSchema.parse({ content: "", jurisdiction: "city" })).toThrow(ZodError);
        expect(() => complianceCheckSchema.parse({ content: "x", jurisdiction: "unknown" })).toThrow(ZodError);
    });
});

describe("generateSummarySchema", () => {
    it("requires non-empty content and validates optional maxLength", () => {
        expect(generateSummarySchema.parse({ content: "Draft" }).content).toBe("Draft");
        expect(generateSummarySchema.parse({ content: "Draft", maxLength: 500 }).maxLength).toBe(500);
        expect(() => generateSummarySchema.parse({ content: "" })).toThrow(ZodError);
        // maxLength must be a positive integer up to 2000
        expect(() => generateSummarySchema.parse({ content: "x", maxLength: 0 })).toThrow(ZodError);
        expect(() => generateSummarySchema.parse({ content: "x", maxLength: 2001 })).toThrow(ZodError);
        expect(() => generateSummarySchema.parse({ content: "x", maxLength: 1.5 })).toThrow(ZodError);
    });
});

describe("suggestReferencesSchema", () => {
    it("requires non-empty content and validates optional sectionNumber", () => {
        expect(suggestReferencesSchema.parse({ content: "x" }).sectionNumber).toBeUndefined();
        expect(suggestReferencesSchema.parse({ content: "x", sectionNumber: 3 }).sectionNumber).toBe(3);
        expect(() => suggestReferencesSchema.parse({ content: "" })).toThrow(ZodError);
        expect(() => suggestReferencesSchema.parse({ content: "x", sectionNumber: 0 })).toThrow(ZodError);
        expect(() => suggestReferencesSchema.parse({ content: "x", sectionNumber: -1 })).toThrow(ZodError);
    });
});

describe("ordinanceGenerationParamsSchema", () => {
    const baseParams = {
        topic: "Curfew hours",
        ordinanceType: "barangay" as const,
        jurisdiction: { name: "Barangay San Roque" },
        problemStatement: "Minors are unsupervised after hours.",
        objectives: ["Reduce nighttime incidents"],
        targetPopulation: "Minors aged 17 and below",
        prohibitedActs: ["Being outdoors between 10pm and 4am without a guardian"],
        enforcementBody: "Barangay Tanod",
    };

    it("accepts a complete ordinance generation payload", () => {
        const parsed = ordinanceGenerationParamsSchema.parse(baseParams);
        expect(parsed.topic).toBe("Curfew hours");
        expect(parsed.objectives).toHaveLength(1);
    });

    it("requires at least one objective", () => {
        expect(() => ordinanceGenerationParamsSchema.parse({ ...baseParams, objectives: [] })).toThrow(ZodError);
    });

    it("accepts optional penalty tiers and exceptions", () => {
        const withPenalties = ordinanceGenerationParamsSchema.parse({
            ...baseParams,
            penalties: { firstOffense: "warning", secondOffense: "fine of 500 PHP" },
            exceptions: ["medical emergencies"],
        });
        expect(withPenalties.penalties?.firstOffense).toBe("warning");
        expect(withPenalties.exceptions).toHaveLength(1);
    });

    it("rejects an unknown ordinance type", () => {
        expect(() =>
            ordinanceGenerationParamsSchema.parse({ ...baseParams, ordinanceType: "national" }),
        ).toThrow(ZodError);
    });
});

describe("loginSchema", () => {
    it("accepts a valid login payload", () => {
        expect(loginSchema.parse({ email: "user@example.com", password: "x" }).email).toBe("user@example.com");
    });

    it("rejects malformed emails and empty passwords", () => {
        expect(() => loginSchema.parse({ email: "not-an-email", password: "x" })).toThrow(ZodError);
        expect(() => loginSchema.parse({ email: "user@example.com", password: "" })).toThrow(ZodError);
    });
});

describe("registerSchema", () => {
    const valid = {
        email: "user@example.com",
        password: "supersecret",
        name: "Maria Santos",
    };

    it("accepts a valid registration payload", () => {
        const parsed = registerSchema.parse(valid);
        expect(parsed.name).toBe("Maria Santos");
    });

    it("requires passwords of at least 8 characters", () => {
        expect(() => registerSchema.parse({ ...valid, password: "short" })).toThrow(ZodError);
    });

    it("requires names of at least 2 characters", () => {
        expect(() => registerSchema.parse({ ...valid, name: "M" })).toThrow(ZodError);
        expect(() => registerSchema.parse({ ...valid, name: "" })).toThrow(ZodError);
    });

    it("accepts an optional organization field", () => {
        const parsed = registerSchema.parse({ ...valid, organization: "LGU" });
        expect(parsed.organization).toBe("LGU");
    });
});

describe("updateProfileSchema", () => {
    it("accepts an empty object (no fields required)", () => {
        expect(updateProfileSchema.parse({})).toEqual({});
    });

    it("validates name length when provided", () => {
        expect(updateProfileSchema.parse({ name: "Maria" }).name).toBe("Maria");
        expect(() => updateProfileSchema.parse({ name: "M" })).toThrow(ZodError);
    });
});

describe("changePasswordSchema", () => {
    it("requires matching newPassword and confirmPassword", () => {
        const parsed = changePasswordSchema.parse({
            currentPassword: "oldpw1234",
            newPassword: "newsecret",
            confirmPassword: "newsecret",
        });
        expect(parsed.newPassword).toBe("newsecret");
    });

    it("rejects mismatched passwords with a path-scoped error", () => {
        try {
            changePasswordSchema.parse({
                currentPassword: "oldpw1234",
                newPassword: "newsecret",
                confirmPassword: "different",
            });
            throw new Error("expected to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(ZodError);
            const zodError = error as ZodError;
            expect(zodError.issues.some((i) => i.path[0] === "confirmPassword")).toBe(true);
        }
    });

    it("rejects a new password shorter than 8 characters", () => {
        expect(() =>
            changePasswordSchema.parse({
                currentPassword: "oldpw1234",
                newPassword: "short",
                confirmPassword: "short",
            }),
        ).toThrow(ZodError);
    });
});

describe("templateQuerySchema", () => {
    it("applies default page=1 and limit=10", () => {
        const parsed = templateQuerySchema.parse({});
        expect(parsed.page).toBe(1);
        expect(parsed.limit).toBe(10);
    });

    it("coerces string query values to numbers", () => {
        const parsed = templateQuerySchema.parse({ page: "3", limit: "25" });
        expect(parsed.page).toBe(3);
        expect(parsed.limit).toBe(25);
    });

    it("caps limit at 100", () => {
        expect(() => templateQuerySchema.parse({ limit: 200 })).toThrow(ZodError);
    });

    it("rejects negative or zero page numbers", () => {
        expect(() => templateQuerySchema.parse({ page: 0 })).toThrow(ZodError);
        expect(() => templateQuerySchema.parse({ page: -1 })).toThrow(ZodError);
    });

    it("coerces the isPublic query string into a boolean", () => {
        // z.coerce.boolean() uses JavaScript's Boolean() coercion, so any
        // non-empty string becomes true. Document that surprising-but-real
        // behavior so a future refactor doesn't change it accidentally.
        expect(templateQuerySchema.parse({ isPublic: "true" }).isPublic).toBe(true);
        expect(templateQuerySchema.parse({ isPublic: "1" }).isPublic).toBe(true);
        expect(templateQuerySchema.parse({ isPublic: "false" }).isPublic).toBe(true);
        expect(templateQuerySchema.parse({ isPublic: "" }).isPublic).toBe(false);
    });

    it("accepts a category and a single-jurisdiction filter", () => {
        const parsed = templateQuerySchema.parse({
            category: "Public Safety",
            jurisdiction: "city",
        });
        expect(parsed.category).toBe("Public Safety");
        expect(parsed.jurisdiction).toBe("city");
    });

    it("rejects an unknown jurisdiction in the query", () => {
        expect(() => templateQuerySchema.parse({ jurisdiction: "national" })).toThrow(ZodError);
    });
});
