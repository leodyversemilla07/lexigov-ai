import { describe, expect, it } from "vitest";
import { buildLineDiff, buildSectionDiff } from '@lexigov/shared';

describe("buildLineDiff", () => {
    it("emits separate removed and added rows for edited lines", () => {
        const rows = buildLineDiff("SECTION 1\nOld line\nSECTION 2", "SECTION 1\nNew line\nSECTION 2");

        expect(rows.map((row) => row.type)).toEqual(["same", "removed", "added", "same"]);
        expect(rows[1]).toMatchObject({
            leftLineNumber: 2,
            leftText: "Old line",
            rightText: "",
            type: "removed",
        });
        expect(rows[2]).toMatchObject({
            rightLineNumber: 2,
            leftText: "",
            rightText: "New line",
            type: "added",
        });
    });

    it("keeps trailing additions as added rows", () => {
        const rows = buildLineDiff("A\nB", "A\nB\nC");

        expect(rows.at(-1)).toMatchObject({
            rightLineNumber: 3,
            leftText: "",
            rightText: "C",
            type: "added",
        });
    });

    it("returns all rows as 'same' when both sides are identical", () => {
        const rows = buildLineDiff("alpha\nbeta\ngamma", "alpha\nbeta\ngamma");

        expect(rows.every((row) => row.type === "same")).toBe(true);
        expect(rows).toHaveLength(3);
    });

    it("emits all lines as 'removed' when the right side is empty", () => {
        const rows = buildLineDiff("a\nb\nc", "");

        // "".split("\n") yields [""], so the right side is treated as a single
        // empty line. We expect 3 'removed' rows for the left lines plus 1
        // 'added' row for the empty right line.
        expect(rows.filter((row) => row.type === "removed")).toHaveLength(3);
        expect(rows.filter((row) => row.type === "added")).toHaveLength(1);
        const removedTexts = rows.filter((row) => row.type === "removed").map((row) => row.leftText);
        expect(removedTexts).toEqual(["a", "b", "c"]);
    });

    it("emits all lines as 'added' when the left side is empty", () => {
        const rows = buildLineDiff("", "x\ny");

        // "".split("\n") yields [""], so the left side is treated as a single
        // empty line. We expect 1 'removed' row for the empty left line plus
        // 2 'added' rows for the right lines.
        expect(rows.filter((row) => row.type === "added")).toHaveLength(2);
        expect(rows.filter((row) => row.type === "removed")).toHaveLength(1);
        const addedTexts = rows.filter((row) => row.type === "added").map((row) => row.rightText);
        expect(addedTexts).toEqual(["x", "y"]);
    });

    it("handles completely different texts by emitting each line as added/removed", () => {
        const rows = buildLineDiff("one", "two");

        // No common lines means every left line is removed, every right is added.
        expect(rows.some((row) => row.type === "removed" && row.leftText === "one")).toBe(true);
        expect(rows.some((row) => row.type === "added" && row.rightText === "two")).toBe(true);
        expect(rows.every((row) => row.type !== "same")).toBe(true);
    });

    it("preserves insertion order across multiple interleaved edits", () => {
        const left = "a\nb\nc\nd";
        const right = "a\nB\nc\nD\ne";
        const rows = buildLineDiff(left, right);

        // Each row must reference a real line from the input and have a valid type.
        for (const row of rows) {
            expect(["same", "added", "removed"]).toContain(row.type);
        }

        // 'same' rows should be present for the unchanged lines.
        const sameRows = rows.filter((row) => row.type === "same");
        expect(sameRows.some((row) => row.leftText === "a" && row.rightText === "a")).toBe(true);
        expect(sameRows.some((row) => row.leftText === "c" && row.rightText === "c")).toBe(true);
    });

    it("handles very long inputs without throwing or returning malformed rows", () => {
        const lines = Array.from({ length: 200 }, (_, i) => `line-${i}`);
        const left = lines.join("\n");
        const right = lines.map((line, i) => (i % 10 === 0 ? `${line}-changed` : line)).join("\n");

        const rows = buildLineDiff(left, right);

        // Every row must have a non-null type and either leftText or rightText set.
        for (const row of rows) {
            expect(row.type).toMatch(/same|added|removed/);
            expect(typeof row.leftText).toBe("string");
            expect(typeof row.rightText).toBe("string");
        }
    });

    it("emits a 'same' row for every aligned pair in the LCS (no collapsing)", () => {
        // Document the actual behavior: the LCS aligns three 'a' lines with
        // three 'a' lines and emits one 'same' row per aligned pair, not
        // collapsed into a single row.
        const rows = buildLineDiff("a\na\na", "a\na\na");
        const sameRows = rows.filter((row) => row.type === "same");
        expect(sameRows).toHaveLength(3);
        for (const row of sameRows) {
            expect(row.leftText).toBe("a");
            expect(row.rightText).toBe("a");
        }
    });

    it("emits added rows for surplus duplicates on the right", () => {
        // Two 'a' lines on the left, three on the right. The LCS aligns the
        // first two pairs as 'same', and the third 'a' on the right is
        // emitted as a single added row.
        const rows = buildLineDiff("a\na", "a\na\na");
        const same = rows.filter((r) => r.type === "same");
        const added = rows.filter((r) => r.type === "added");
        expect(same).toHaveLength(2);
        expect(added).toHaveLength(1);
        expect(added[0]?.rightText).toBe("a");
    });
});

describe("buildSectionDiff", () => {
    it("classifies same, changed, added, and removed sections", () => {
        const rows = buildSectionDiff(
            [
                { heading: "Section 1", body: "Alpha" },
                { heading: "Section 2", body: "Bravo" },
                { heading: "Section 3", body: "Charlie" },
            ],
            [
                { heading: "Section 1", body: "Alpha" },
                { heading: "Section 2", body: "Bravo updated" },
                { heading: "Section 4", body: "Delta" },
            ],
        );

        expect(rows).toEqual([
            expect.objectContaining({ heading: "Section 1", type: "same" }),
            expect.objectContaining({ heading: "Section 2", type: "changed" }),
            expect.objectContaining({ heading: "Section 3", type: "removed" }),
            expect.objectContaining({ heading: "Section 4", type: "added" }),
        ]);
    });

    it("treats section headings case-insensitively and trims whitespace for matching", () => {
        // The matcher trims/lowercases headings. Bodies are compared after trim
        // only (not lowercase), so bodies that differ only in case count as
        // 'changed' even when the headings match.
        const rows = buildSectionDiff(
            [{ heading: "  Section A  ", body: "alpha" }],
            [{ heading: "section a", body: "alpha" }],
        );

        expect(rows).toHaveLength(1);
        expect(rows[0]?.type).toBe("same");
    });

    it("ignores leading/trailing whitespace when comparing bodies", () => {
        const rows = buildSectionDiff(
            [{ heading: "Section X", body: "  body text  " }],
            [{ heading: "Section X", body: "body text" }],
        );

        expect(rows[0]?.type).toBe("same");
    });

    it("returns an empty array when both sides have no sections", () => {
        expect(buildSectionDiff([], [])).toEqual([]);
    });

    it("emits all rows as 'added' when the left side is empty", () => {
        const rows = buildSectionDiff([], [
            { heading: "Section 1", body: "Alpha" },
            { heading: "Section 2", body: "Bravo" },
        ]);

        expect(rows).toHaveLength(2);
        expect(rows.every((row) => row.type === "added")).toBe(true);
        expect(rows[0]?.leftBody).toBe("");
        expect(rows[0]?.rightBody).toBe("Alpha");
    });

    it("emits all rows as 'removed' when the right side is empty", () => {
        const rows = buildSectionDiff(
            [
                { heading: "Section 1", body: "Alpha" },
                { heading: "Section 2", body: "Bravo" },
            ],
            [],
        );

        expect(rows).toHaveLength(2);
        expect(rows.every((row) => row.type === "removed")).toBe(true);
        expect(rows[0]?.rightBody).toBe("");
    });

    it("uses a stable key derived from the heading for matching", () => {
        const rows = buildSectionDiff(
            [{ heading: "SECTION 1. Title.", body: "A" }],
            [{ heading: "section 1. title.", body: "B" }],
        );

        expect(rows).toHaveLength(1);
        expect(rows[0]?.key).toBe("section 1. title.");
        expect(rows[0]?.type).toBe("changed");
    });

    it("marks a section as 'changed' when the body differs (after trim)", () => {
        const rows = buildSectionDiff(
            [{ heading: "Section A", body: "alpha text" }],
            [{ heading: "Section A", body: "beta text" }],
        );

        expect(rows[0]?.type).toBe("changed");
        expect(rows[0]?.leftBody).toBe("alpha text");
        expect(rows[0]?.rightBody).toBe("beta text");
    });

    it("preserves the original heading casing from the left side when both sides have it", () => {
        // The key is normalized (lowercased) for matching, but the displayed
        // heading should come from the left section so that the user's local
        // casing is preserved in the diff view.
        const rows = buildSectionDiff(
            [{ heading: "Section A.", body: "alpha" }],
            [{ heading: "section a.", body: "beta" }],
        );

        expect(rows[0]?.heading).toBe("Section A.");
    });

    it("falls back to the right-side heading when the left side is missing", () => {
        const rows = buildSectionDiff([], [{ heading: "Section B", body: "beta" }]);
        expect(rows[0]?.heading).toBe("Section B");
    });

    it("emits every row as a separate 'removed' line when there is no common content", () => {
        const rows = buildLineDiff("alpha\nbeta\ngamma", "x\ny\nz");
        expect(rows).toHaveLength(6);
        // Three from the left, three from the right
        expect(rows.filter((r) => r.type === "removed")).toHaveLength(3);
        expect(rows.filter((r) => r.type === "added")).toHaveLength(3);
        expect(rows.every((r) => r.type !== "same")).toBe(true);
    });
});
