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
});
