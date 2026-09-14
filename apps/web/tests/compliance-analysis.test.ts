import { describe, expect, it } from "vitest";
import {
    analyzeDeterministicCompliance,
    buildComplianceResultFromIssues,
    mergeComplianceIssues,
} from '@lexigov/shared';

describe("analyzeDeterministicCompliance", () => {
    it("flags missing core ordinance structure", () => {
        const result = analyzeDeterministicCompliance(
            "This is a short policy statement without numbered sections or final clauses.",
            "municipal",
        );

        expect(result.isValid).toBe(false);
        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Missing numbered sections", type: "critical" }),
                expect.objectContaining({ title: "Missing effectivity clause", type: "critical" }),
                expect.objectContaining({ title: "Missing separability clause", type: "warning" }),
            ]),
        );
    });

    it("detects penalty ceilings for municipal ordinances", () => {
        const content = [
            "Republic of the Philippines",
            "Municipality of Sample",
            "WHEREAS, public safety requires regulation.",
            "SECTION 1. Title.",
            "This ordinance shall be known as the Sample Ordinance.",
            "SECTION 2. Penalties.",
            "Any violator shall pay a fine of P3,000.00 or suffer imprisonment of 8 months.",
            "SECTION 3. Separability Clause.",
            "If any portion is invalid, the rest remains effective.",
            "SECTION 4. Repealing Clause.",
            "Inconsistent ordinances are repealed.",
            "SECTION 5. Effectivity Clause.",
            "This ordinance shall take effect after posting and publication.",
        ].join("\n");

        const result = analyzeDeterministicCompliance(content, "municipal");

        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Penalty fine exceeds jurisdiction limit", type: "critical" }),
                expect.objectContaining({ title: "Imprisonment term exceeds jurisdiction limit", type: "critical" }),
            ]),
        );
    });

    it("accepts a structurally complete city ordinance without critical findings", () => {
        const content = [
            "Republic of the Philippines",
            "City of Sample",
            "WHEREAS, the city seeks to regulate public safety matters;",
            "SECTION 1. Title.",
            "This ordinance shall be known as the Sample City Ordinance.",
            "SECTION 2. Definition of Terms.",
            "This section defines the covered establishments and regulated acts.",
            "SECTION 3. Penalties.",
            "Any violator shall pay a fine of P5,000.00 or suffer imprisonment of 12 months, at the discretion of the court.",
            "SECTION 4. Separability Clause.",
            "If any provision is declared invalid, the remainder shall remain in full force and effect.",
            "SECTION 5. Repealing Clause.",
            "All ordinances inconsistent with this measure are repealed or modified accordingly.",
            "SECTION 6. Effectivity Clause.",
            "This ordinance shall take effect after posting and publication as required by law.",
        ].join("\n");

        const result = analyzeDeterministicCompliance(content, "city");

        expect(result.isValid).toBe(true);
        expect(result.issues.some((issue) => issue.type === "critical")).toBe(false);
    });
});

describe("compliance issue merging", () => {
    it("deduplicates issues and recomputes the aggregate result", () => {
        const merged = mergeComplianceIssues(
            [
                {
                    type: "warning",
                    title: "Missing WHEREAS clauses",
                    description: "The draft lacks a recital.",
                    suggestion: "Add a recital.",
                },
            ],
            [
                {
                    type: "warning",
                    title: "Missing WHEREAS clauses",
                    description: "Duplicate issue.",
                    suggestion: "Duplicate suggestion.",
                },
                {
                    type: "suggestion",
                    title: "Add definitions",
                    description: "Key terms are not defined.",
                    suggestion: "Add a definitions section.",
                },
            ],
        );

        expect(merged).toHaveLength(2);

        const result = buildComplianceResultFromIssues(merged);
        expect(result.overallScore).toBeLessThan(100);
        expect(result.issues).toHaveLength(2);
    });

    it("stops merging once the merged list reaches the maximum size", () => {
        const base = Array.from({ length: 4 }, (_, i) => ({
            type: "suggestion" as const,
            title: `Base issue ${i}`,
            description: "desc",
            suggestion: "sug",
        }));
        const extras = Array.from({ length: 10 }, (_, i) => ({
            type: "suggestion" as const,
            title: `Extra issue ${i}`,
            description: "desc",
            suggestion: "sug",
        }));

        const merged = mergeComplianceIssues(base, extras);

        // The implementation caps the list near MAX_ISSUES (8). We assert the
        // merged size is bounded above by MAX_ISSUES + 1 (one extra can slip in
        // before the break), but is strictly less than base + extras.
        expect(merged.length).toBeLessThanOrEqual(8);
        expect(merged.length).toBeLessThan(base.length + extras.length);
    });

    it("returns isValid=false with issues for content that is entirely missing", () => {
        const result = analyzeDeterministicCompliance("", "barangay");
        // Empty content misses several structural checks; the score drops
        // accordingly and isValid must be false because at least one critical
        // issue (missing sections, missing effectivity) is raised.
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.overallScore).toBeLessThan(100);
    });

    it("exposes a buildComplianceResultFromIssues that wraps arbitrary issue lists", () => {
        // The wrapper applies the same MAX_ISSUES cap and isValid derivation
        // as the analyzer itself. Useful for callers that want to recompute a
        // result after manually mutating the issue list.
        const result = buildComplianceResultFromIssues([
            { type: "critical", title: "A", description: "", suggestion: "" },
            { type: "critical", title: "B", description: "", suggestion: "" },
            { type: "warning", title: "C", description: "", suggestion: "" },
        ]);
        expect(result.isValid).toBe(false);
        expect(result.overallScore).toBeLessThan(100);
    });

    it("flags a fine that exceeds the barangay 1000 PHP cap", () => {
        const content = [
            "Republic of the Philippines",
            "Barangay San Roque",
            "SECTION 1. Title.",
            "This ordinance shall be known as the Curfew Ordinance.",
            "SECTION 2. Penalties.",
            "Any violator shall pay a fine of P1,500.00.",
            "SECTION 3. Separability Clause.",
            "If any portion is invalid, the rest remains effective.",
            "SECTION 4. Repealing Clause.",
            "Inconsistent ordinances are repealed.",
            "SECTION 5. Effectivity Clause.",
            "This ordinance shall take effect after posting and publication.",
        ].join("\n");

        const result = analyzeDeterministicCompliance(content, "barangay");

        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Penalty fine exceeds jurisdiction limit", type: "critical" }),
            ]),
        );
    });

    it("converts day-based imprisonment to a fraction of a month for limit comparison", () => {
        // 30 days = 1 month. 60 days = 2 months. The municipal limit is 6 months.
        const makeContent = (penalty: string) =>
            [
                "Republic of the Philippines",
                "Municipality of Sample",
                "SECTION 1. Title.",
                "This ordinance shall be known as the Sample Ordinance.",
                "SECTION 2. Penalties.",
                penalty,
                "SECTION 3. Separability Clause.",
                "If any portion is invalid, the rest remains effective.",
                "SECTION 4. Repealing Clause.",
                "Inconsistent ordinances are repealed.",
                "SECTION 5. Effectivity Clause.",
                "This ordinance shall take effect after posting and publication.",
            ].join("\n");

        // 90 days = 3 months, well under the 6-month municipal limit
        const underLimit = analyzeDeterministicCompliance(
            makeContent("Any violator shall suffer imprisonment of 90 days."),
            "municipal",
        );
        expect(underLimit.issues.some((i) => i.title === "Imprisonment term exceeds jurisdiction limit")).toBe(false);

        // 365 days = ~12.16 months, which exceeds 6 months for a municipal ordinance
        const overLimit = analyzeDeterministicCompliance(
            makeContent("Any violator shall suffer imprisonment of 365 days."),
            "municipal",
        );
        expect(overLimit.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Imprisonment term exceeds jurisdiction limit", type: "critical" }),
            ]),
        );
    });

    it("converts year-based imprisonment to months for limit comparison", () => {
        const content = [
            "Republic of the Philippines",
            "Province of Sample",
            "SECTION 1. Title.",
            "This ordinance shall be known as the Sample Ordinance.",
            "SECTION 2. Penalties.",
            "Any violator shall suffer imprisonment of 2 years.",
            "SECTION 3. Separability Clause.",
            "If any portion is invalid, the rest remains effective.",
            "SECTION 4. Repealing Clause.",
            "Inconsistent ordinances are repealed.",
            "SECTION 5. Effectivity Clause.",
            "This ordinance shall take effect after posting and publication.",
        ].join("\n");

        // 2 years = 24 months, which exceeds the 12-month provincial limit
        const result = analyzeDeterministicCompliance(content, "provincial");
        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ title: "Imprisonment term exceeds jurisdiction limit", type: "critical" }),
            ]),
        );
    });

    it("flags unauthorized imprisonment for barangay ordinances (RA 7160 \u00a7 391(a)(14))", () => {
        const content = [
            "Republic of the Philippines",
            "Barangay San Roque",
            "SECTION 1. Title.",
            "This ordinance shall be known as the Curfew Ordinance.",
            "SECTION 2. Penalties.",
            "Any violator shall suffer imprisonment of 1 month.",
            "SECTION 3. Separability Clause.",
            "If any portion is invalid, the rest remains effective.",
            "SECTION 4. Repealing Clause.",
            "Inconsistent ordinances are repealed.",
            "SECTION 5. Effectivity Clause.",
            "This ordinance shall take effect after posting and publication.",
        ].join("\n");

        const result = analyzeDeterministicCompliance(content, "barangay");
        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: "Imprisonment appears unauthorized for this jurisdiction",
                    type: "critical",
                }),
            ]),
        );
    });

    it("treats a result with only suggestion issues as isValid=true", () => {
        // A draft that is structurally complete but only triggers a suggestion
        // should still be considered valid (no critical findings).
        const result = analyzeDeterministicCompliance(
            [
                "Republic of the Philippines",
                "City of Sample",
                "WHEREAS, the city seeks to regulate permit issuance;",
                "SECTION 1. Title.",
                "This ordinance shall be known as the Sample Ordinance.",
                "SECTION 2. Permit Requirements.",
                "Applicants must secure a permit before operating.",
                "SECTION 3. Penalties.",
                "Any violator shall pay a fine of P1,000.00.",
                "SECTION 4. Separability Clause.",
                "If any portion is invalid, the rest remains effective.",
                "SECTION 5. Repealing Clause.",
                "Inconsistent ordinances are repealed.",
                "SECTION 6. Effectivity Clause.",
                "This ordinance shall take effect after posting and publication.",
            ].join("\n"),
            "city",
        );

        expect(result.isValid).toBe(true);
        expect(result.issues.some((i) => i.type === "critical")).toBe(false);
    });

    it("flags a draft that mentions penalties but does not specify an amount or term", () => {
        // Penalty language is present but no fine number or imprisonment term
        // is found — the analyzer suggests the draft be more specific.
        const result = analyzeDeterministicCompliance(
            [
                "Republic of the Philippines",
                "Barangay San Roque",
                "SECTION 1. Title.",
                "This ordinance shall be known as the Sample Ordinance.",
                "SECTION 2. Penalties.",
                "Violators shall be subject to penalties as provided by law.",
                "SECTION 3. Separability Clause.",
                "If any portion is invalid, the rest remains effective.",
                "SECTION 4. Repealing Clause.",
                "Inconsistent ordinances are repealed.",
                "SECTION 5. Effectivity Clause.",
                "This ordinance shall take effect after posting and publication.",
            ].join("\n"),
            "barangay",
        );

        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: "Penalty language is not specific",
                    type: "suggestion",
                }),
            ]),
        );
    });

    it("flags tax and revenue measures that lack a public hearing recital (RA 7160 § 187)", () => {
        const content = [
            "Republic of the Philippines",
            "City of Sample",
            "WHEREAS, the city needs to adjust local regulatory fees;",
            "SECTION 1. Title.",
            "This ordinance shall be known as the Revised Regulatory Fee Ordinance.",
            "SECTION 2. Tax and Fee Adjustment.",
            "A regulatory fee of P500.00 is hereby imposed on all commercial stalls.",
            "SECTION 3. Separability Clause.",
            "If any portion is invalid, the rest remains effective.",
            "SECTION 4. Repealing Clause.",
            "Inconsistent ordinances are repealed.",
            "SECTION 5. Effectivity Clause.",
            "This ordinance shall take effect after posting and publication.",
        ].join("\n");

        const result = analyzeDeterministicCompliance(content, "city");

        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: "Tax/revenue measure lacks public hearing recital",
                    type: "warning",
                }),
            ]),
        );
    });

    it("flags appropriation ordinances lacking the current 5% LDRRMF allocation (RA 10121 § 21)", () => {
        const content = [
            "Republic of the Philippines",
            "Municipality of Sample",
            "WHEREAS, funds must be allocated for the ensuing fiscal year;",
            "SECTION 1. Title.",
            "This ordinance shall be known as the Annual Budget Ordinance 2025.",
            "SECTION 2. Appropriations.",
            "The sum of P50,000,000 is hereby appropriated for general operational expenses.",
            "SECTION 3. Separability Clause.",
            "If any portion is invalid, the rest remains effective.",
            "SECTION 4. Repealing Clause.",
            "Inconsistent ordinances are repealed.",
            "SECTION 5. Effectivity Clause.",
            "This ordinance shall take effect after posting and publication.",
        ].join("\n");

        const result = analyzeDeterministicCompliance(content, "municipal");

        expect(result.issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: "Mandatory 5% Calamity / LDRRMF set-aside check",
                    type: "warning",
                }),
            ]),
        );
    });
});

