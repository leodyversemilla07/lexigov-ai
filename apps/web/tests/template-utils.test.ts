import { describe, expect, it } from "vitest";
import {
    getTemplateBody,
    getTemplateDocumentType,
    getTemplateJurisdiction,
    getTemplatePrompt,
    getTemplateSections,
    type TemplateData,
} from '@lexigov/shared';

const baseTemplate: TemplateData = {
    id: "template-1",
    _id: "template-1",
    name: "Barangay Curfew Ordinance",
    category: "Public Safety",
    jurisdiction: ["barangay"],
    usageCount: 0,
    structure: {
        documentType: "ORDINANCE",
        prompt: "Create an ordinance for [JURISDICTION] with penalty guidance of [PENALTY].",
        body: "SECTION 1. Title.\nKnown as the [JURISDICTION] ordinance.",
    },
};

describe("template utils", () => {
    it("reads document type and primary jurisdiction", () => {
        expect(getTemplateDocumentType(baseTemplate)).toBe("ORDINANCE");
        expect(getTemplateJurisdiction(baseTemplate)).toBe("barangay");
    });

    it("replaces jurisdiction and penalty placeholders in prompts", () => {
        expect(
            getTemplatePrompt(baseTemplate, "Barangay San Roque", "Fine up to P1,000"),
        ).toBe("Create an ordinance for Barangay San Roque with penalty guidance of Fine up to P1,000.");
    });

    it("builds section-aware bodies and resolves placeholders", () => {
        const template: TemplateData = {
            ...baseTemplate,
            structure: {
                documentType: "ORDINANCE",
                sections: [
                    {
                        id: "title",
                        heading: "SECTION 1. Title.",
                        body: "This shall be known as the [JURISDICTION] Curfew Ordinance.",
                    },
                    {
                        id: "penalty",
                        heading: "SECTION 2. Penalties.",
                        body: "Violations shall be penalized by [PENALTY].",
                    },
                ],
            },
        };

        expect(getTemplateSections(template)).toHaveLength(2);
        expect(getTemplateBody(template, "Barangay San Roque", "Fine up to P1,000")).toBe(
            [
                "SECTION 1. Title.",
                "This shall be known as the Barangay San Roque Curfew Ordinance.",
                "",
                "SECTION 2. Penalties.",
                "Violations shall be penalized by Fine up to P1,000.",
            ].join("\n"),
        );
    });

    it("returns 'ORDINANCE' as the fallback document type when no candidate is present", () => {
        const template: TemplateData = {
            ...baseTemplate,
            structure: { sections: [] },
        };

        expect(getTemplateDocumentType(template)).toBe("ORDINANCE");
    });

    it("falls back to a generated prompt when neither prompt nor instructions is present", () => {
        const template: TemplateData = {
            ...baseTemplate,
            structure: { documentType: "ORDINANCE" },
        };

        const prompt = getTemplatePrompt(template, "Barangay San Roque", "Fine up to P1,000");

        expect(prompt).toContain("Barangay San Roque");
        expect(prompt).toContain("Fine up to P1,000");
        expect(prompt).toContain("Public Safety");
    });

    it("returns null for jurisdiction when the array contains no recognized value", () => {
        const template: TemplateData = {
            ...baseTemplate,
            jurisdiction: ["unknown-jurisdiction"],
        };

        expect(getTemplateJurisdiction(template)).toBeNull();
    });

    it("uses the section-aware body when template sections are defined", () => {
        const template: TemplateData = {
            ...baseTemplate,
            structure: {
                sections: [
                    { id: "title", heading: "SECTION 1. Title.", body: "[JURISDICTION] ordinance." },
                ],
            },
        };

        const body = getTemplateBody(template, "Barangay San Roque");
        expect(body).toContain("Barangay San Roque ordinance.");
    });

    it("falls back to a synthesized body when the template has no body or sections", () => {
        const template: TemplateData = {
            ...baseTemplate,
            structure: { documentType: "ORDINANCE" },
        };

        const body = getTemplateBody(template, "Barangay San Roque", "Fine up to P1,000");

        // The synthesized fallback body should include the document type, name,
        // jurisdiction name, and the penalty guidance.
        expect(body).toContain("ORDINANCE");
        expect(body).toContain("Barangay Curfew Ordinance");
        expect(body).toContain("Barangay San Roque");
        expect(body).toContain("Fine up to P1,000");
        expect(body).toContain("SECTION 1. Title.");
        expect(body).toContain("Separability Clause");
        expect(body).toContain("Effectivity Clause");
    });

    it("replaces missing placeholders with bracketed defaults when called with empty inputs", () => {
        const template: TemplateData = {
            ...baseTemplate,
            structure: {
                documentType: "ORDINANCE",
                prompt: "Create an ordinance for [JURISDICTION] with penalty [PENALTY].",
            },
        };

        const prompt = getTemplatePrompt(template, "");

        expect(prompt).toContain("[Jurisdiction Name]");
        expect(prompt).toContain("[Penalty]");
    });

    it("does not duplicate sections mirrored in structure and exampleContent", () => {
        const mirrored = [{ heading: "SECTION 1. Title.", body: "Body" }];
        const sections = getTemplateSections({
            ...baseTemplate,
            structure: { sections: mirrored },
            exampleContent: { sections: mirrored },
        });
        expect(sections).toHaveLength(1);
    });

    it("skips invalid section entries (non-objects, arrays, or empty objects)", () => {
        const template: TemplateData = {
            ...baseTemplate,
            structure: {
                sections: [
                    null,
                    "not an object",
                    [],
                    { heading: "", body: "" }, // empty entry, should be filtered
                    { heading: "Valid Section", body: "Body" },
                ],
            },
        };

        const sections = getTemplateSections(template);
        expect(sections).toHaveLength(1);
        expect(sections[0]?.heading).toBe("Valid Section");
    });

    it("accepts the optional _id field for templates hydrated from a legacy source", () => {
        // _id was the only field before the id refactor; old records may still
        // carry it. The type allows it but it should be ignored by the helpers.
        const template: TemplateData = {
            id: "new-id",
            _id: "legacy-id",
            name: "Test",
            category: "Other",
            jurisdiction: ["barangay"],
            usageCount: 0,
            structure: {},
        };

        expect(getTemplateDocumentType(template)).toBe("ORDINANCE");
        expect(getTemplateJurisdiction(template)).toBe("barangay");
    });
});
