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
});
