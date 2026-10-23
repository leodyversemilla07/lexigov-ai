import { describe, expect, it } from "vitest";
import {
    buildDraftSectionsFromBody,
    buildDraftSummary,
    composeDraftBodyFromSections,
    createDraftSection,
    extractDraftBody,
    extractDraftSections,
    normalizeDraftContent,
    updateDraftBodyContent,
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

    it("returns an empty array for empty or whitespace-only input", () => {
        expect(buildDraftSectionsFromBody("")).toEqual([]);
        expect(buildDraftSectionsFromBody("   \n  \n  ")).toEqual([]);
    });

    it("falls back to paragraph splitting when no SECTION markers are present", () => {
        const body = ["First paragraph here.", "", "Second paragraph here."].join("\n");

        const sections = buildDraftSectionsFromBody(body);
        expect(sections).toHaveLength(2);
        // Paragraphs without heading markers become "Section 1", "Section 2", ...
        expect(sections[0]?.heading).toBe("Section 1");
        expect(sections[0]?.body).toBe("First paragraph here.");
        expect(sections[1]?.heading).toBe("Section 2");
        expect(sections[1]?.body).toBe("Second paragraph here.");
    });

    it("detects markdown-style headings in the paragraph fallback", () => {
        const body = ["# Title Heading", "Body text under it.", "", "## Another Heading", "More body."].join("\n");

        const sections = buildDraftSectionsFromBody(body);
        // Markdown headings should be stripped of the # prefix
        expect(sections[0]?.heading).toBe("Title Heading");
        expect(sections[0]?.body).toBe("Body text under it.");
        expect(sections[1]?.heading).toBe("Another Heading");
    });

    it("does not interpret a mixed-case statutory citation as a heading", () => {
        const body = "WHEREAS, authority is granted under Section 16 of RA 7160.";
        const sections = buildDraftSectionsFromBody(body);
        expect(sections).toHaveLength(1);
        expect(sections[0]?.body).toBe(body);
    });

    it("handles a single SECTION block with trailing content", () => {
        const body = ["SECTION 1. Title.", "Some content."].join("\n");
        const sections = buildDraftSectionsFromBody(body);
        expect(sections).toHaveLength(1);
        expect(sections[0]?.body).toBe("Some content.");
    });
});

describe("composeDraftBodyFromSections", () => {
    it("joins sections with a blank line between them", () => {
        const body = composeDraftBodyFromSections([
            { id: "s1", heading: "SECTION 1. Title.", body: "First body." },
            { id: "s2", heading: "SECTION 2. Scope.", body: "Second body." },
        ]);
        expect(body).toBe("SECTION 1. Title.\nFirst body.\n\nSECTION 2. Scope.\nSecond body.");
    });

    it("skips sections that are entirely empty", () => {
        const body = composeDraftBodyFromSections([
            { id: "s1", heading: "A", body: "x" },
            { id: "s2", heading: "", body: "" },
            { id: "s3", heading: "C", body: "z" },
        ]);
        expect(body).toBe("A\nx\n\nC\nz");
    });

    it("returns an empty string for an empty section list", () => {
        expect(composeDraftBodyFromSections([])).toBe("");
    });
});

describe("createDraftSection", () => {
    it("creates a placeholder section with a default heading", () => {
        const section = createDraftSection(0);
        expect(section.heading).toBe("SECTION 1. New Section.");
        expect(section.body).toBe("");
        expect(section.id).toContain("section-1-new-section-1");
    });
});

describe("extractDraftBody", () => {
    it("returns the string as-is when content is a string", () => {
        expect(extractDraftBody("hello world")).toBe("hello world");
    });

    it("returns the body field when content is an object", () => {
        expect(extractDraftBody({ body: "structured body" })).toBe("structured body");
    });

    it("returns an empty string for null, undefined, or non-string body", () => {
        expect(extractDraftBody(null)).toBe("");
        expect(extractDraftBody(undefined)).toBe("");
        expect(extractDraftBody(42)).toBe("");
        expect(extractDraftBody({})).toBe("");
    });
});

describe("extractDraftSections", () => {
    it("prefers stored sections when present", () => {
        const result = extractDraftSections({
            body: "SECTION 1. Different body.",
            sections: [{ id: "x", heading: "Stored", body: "stored body" }],
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.heading).toBe("Stored");
    });

    it("falls back to parsing the body when no stored sections are provided", () => {
        const result = extractDraftSections({ body: "SECTION 1. Title.\nBody text" });
        expect(result).toHaveLength(1);
        expect(result[0]?.heading).toBe("SECTION 1. Title.");
    });

    it("filters out invalid stored section entries", () => {
        const result = extractDraftSections({
            body: "",
            sections: [
                null,
                "not an object",
                { heading: "", body: "" }, // empty, should be filtered
                { heading: "Valid", body: "Body" },
            ],
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.heading).toBe("Valid");
    });
});

describe("buildDraftSummary", () => {
    it("returns the first non-SECTION line as the summary", () => {
        const body = ["SECTION 1. Title.", "Real summary line here.", "More body."].join("\n");
        expect(buildDraftSummary(body)).toBe("Real summary line here.");
    });

    it("returns an empty string when no suitable line is found", () => {
        expect(buildDraftSummary("")).toBe("");
        expect(buildDraftSummary("SECTION 1. Title.")).toBe("");
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

    it("derives a summary from the body when none is provided", () => {
        const normalized = normalizeDraftContent({
            body: "SECTION 1. Title.\nDerived summary line.",
        });
        expect(normalized.summary).toBe("Derived summary line.");
    });

    it("handles non-object content gracefully", () => {
        const normalized = normalizeDraftContent(null);
        expect(normalized.body).toBe("");
        expect(normalized.sections).toEqual([]);
        expect(normalized.summary).toBeUndefined();
    });

    it("drops invalid generatedAt values (non-numbers)", () => {
        const normalized = normalizeDraftContent({
            body: "x",
            generatedAt: "not a number",
        });
        expect(normalized.generatedAt).toBeUndefined();
    });
});

describe("updateDraftBodyContent", () => {
    it("re-parses sections from the new body while preserving metadata", () => {
        const updated = updateDraftBodyContent(
            { prompt: "original", summary: "original summary" },
            "SECTION 1. New Title.\nNew body.",
        );
        expect(updated.body).toBe("SECTION 1. New Title.\nNew body.");
        expect(updated.sections).toHaveLength(1);
        expect(updated.sections[0]?.heading).toBe("SECTION 1. New Title.");
        expect(updated.prompt).toBe("original");
    });

    it("falls back to the existing summary when the new body has no suitable line", () => {
        const updated = updateDraftBodyContent(
            { summary: "kept summary" },
            "",
        );
        expect(updated.summary).toBe("kept summary");
        expect(updated.sections).toEqual([]);
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

    it("preserves headers and WHEREAS recitals before the first edited section", () => {
        const original = [
            "REPUBLIC OF THE PHILIPPINES", "CITY OF TEST", "", "WHEREAS, public welfare requires action;", "",
            "SECTION 1. Title.", "Old body.",
        ].join("\n");
        const updated = updateDraftSectionsContent({ body: original }, [
            { id: "s1", heading: "SECTION 1. Title.", body: "New body." },
        ]);
        expect(updated.body).toContain("REPUBLIC OF THE PHILIPPINES");
        expect(updated.body).toContain("WHEREAS, public welfare requires action;");
        expect(updated.body).toContain("New body.");
        expect(updated.body).not.toContain("Old body.");
    });

    it("fills in default headings and ids for sections that lack them", () => {
        const updated = updateDraftSectionsContent({}, [
            { id: "", heading: "", body: "Some content" },
        ]);
        expect(updated.sections[0]?.heading).toBe("Section 1");
        expect(updated.sections[0]?.id).toContain("section-1");
    });

    it("substitutes default headings and bodies for sections that lack them after trimming", () => {
        const updated = updateDraftSectionsContent({}, [
            { id: "s1", heading: "Keep me", body: "body" },
            { id: "", heading: "  ", body: "  " },
        ]);
        // Both sections pass the filter because empty headings fall back to
        // "Section N" (which is truthy) rather than remaining empty.
        expect(updated.sections).toHaveLength(2);
        expect(updated.sections[0]?.heading).toBe("Keep me");
        expect(updated.sections[1]?.heading).toBe("Section 2");
    });
});
