import { describe, expect, it } from "vitest";
import { buildLineDiff, buildSectionDiff } from "../src/lib/text-diff";

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
});
