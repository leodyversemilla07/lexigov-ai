import { describe, expect, it } from "vitest";
import {
    buildDraftSectionsFromBody,
    normalizeDraftContent,
    updateDraftSectionsContent,
} from '@lexigov/shared';

describe("buildDraftSectionsFromBody", () => {
    it("parses formal section headings into structured sections", () => {
        const body = [
            "SECTION 1. Title.",
            "This ordinance shall be known as the Sample Ordinance.",
            "",
            "SECTION 2. Scope.",
            "This applies to all covered persons.",
        ].join("\n");

        expect(buildDraftSectionsFromBody(body)).toEqual([
            {
                id: "section-1-title-1",
                heading: "SECTION 1. Title.",
                body: "This ordinance shall be known as the Sample Ordinance.",
            },
            {
                id: "section-2-scope-2",
                heading: "SECTION 2. Scope.",
                body: "This applies to all covered persons.",
            },
        ]);
    });
});

describe("normalizeDraftContent", () => {
    it("preserves summary metadata and stored sections", () => {
        const normalized = normalizeDraftContent({
            body: "SECTION 1. Title.\nBody",
            summary: "Existing summary",
            prompt: "Draft this",
            generatedAt: 123,
            model: "azure-openai",
            sections: [{ id: "s1", heading: "SECTION 1. Title.", body: "Body" }],
        });

        expect(normalized).toEqual({
            body: "SECTION 1. Title.\nBody",
            summary: "Existing summary",
            prompt: "Draft this",
            generatedAt: 123,
            model: "azure-openai",
            sections: [{ id: "s1", heading: "SECTION 1. Title.", body: "Body" }],
        });
    });
});

describe("updateDraftSectionsContent", () => {
    it("rebuilds the full body from edited sections", () => {
        const updated = updateDraftSectionsContent(
            { prompt: "keep me" },
            [
                { id: "s1", heading: "SECTION 1. Title.", body: "First section body." },
                { id: "s2", heading: "SECTION 2. Scope.", body: "Second section body." },
            ],
        );

        expect(updated.body).toBe(
            "SECTION 1. Title.\nFirst section body.\n\nSECTION 2. Scope.\nSecond section body.",
        );
        expect(updated.sections).toHaveLength(2);
        expect(updated.prompt).toBe("keep me");
        expect(updated.summary).toBe("First section body.");
    });
});
