import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
    documentStatusValues,
    documentTypeValues,
    jurisdictionLevelValues,
} from "../lib/schemas/enums";
import { createDraftSchema, updateDraftSchema } from "../lib/schemas/draft";
import { createTemplateSchema, templateCategoryValues, updateTemplateSchema } from "../lib/schemas/template";

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
});
