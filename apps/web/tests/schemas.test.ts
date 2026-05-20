import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
    documentStatusValues,
    documentTypeValues,
    jurisdictionLevelValues,
} from "../src/lib/schemas/enums";
import { aiDraftFormSchema } from "../src/lib/schemas/ai";
import { createDraftSchema, draftComposerSchema, updateDraftSchema } from "../src/lib/schemas/draft";
import {
    createTemplateSchema,
    templateCategoryValues,
    templateEditorSchema,
    updateTemplateSchema,
} from "../src/lib/schemas/template";

describe("shared schema enums", () => {
    it("exposes the document, jurisdiction, and status contracts used by the app", () => {
        expect(documentTypeValues).toEqual(["ORDINANCE", "RESOLUTION", "MEMORANDUM", "POLICY"]);
        expect(jurisdictionLevelValues).toEqual(["barangay", "city", "municipal", "provincial"]);
        expect(documentStatusValues).toEqual(["DRAFT", "REVIEW", "FINAL", "ARCHIVED"]);
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
    it("accepts only valid workflow statuses", () => {
        expect(updateDraftSchema.parse({ status: "REVIEW" }).status).toBe("REVIEW");
        expect(() => updateDraftSchema.parse({ status: "PUBLISHED" })).toThrow(ZodError);
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
