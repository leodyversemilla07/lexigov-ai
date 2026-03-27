export type DiffRowType = "same" | "added" | "removed";

export type SectionDiffType = "same" | "changed" | "added" | "removed";

export interface DiffRow {
    leftLineNumber?: number;
    rightLineNumber?: number;
    leftText: string;
    rightText: string;
    type: DiffRowType;
}

export interface SectionDiffRow {
    key: string;
    heading: string;
    type: SectionDiffType;
    leftBody: string;
    rightBody: string;
}

function buildLcsMatrix(leftLines: string[], rightLines: string[]) {
    const matrix = Array.from({ length: leftLines.length + 1 }, () =>
        Array.from({ length: rightLines.length + 1 }, () => 0),
    );

    for (let leftIndex = leftLines.length - 1; leftIndex >= 0; leftIndex -= 1) {
        for (let rightIndex = rightLines.length - 1; rightIndex >= 0; rightIndex -= 1) {
            if (leftLines[leftIndex] === rightLines[rightIndex]) {
                matrix[leftIndex][rightIndex] = matrix[leftIndex + 1][rightIndex + 1] + 1;
            } else {
                matrix[leftIndex][rightIndex] = Math.max(
                    matrix[leftIndex + 1][rightIndex],
                    matrix[leftIndex][rightIndex + 1],
                );
            }
        }
    }

    return matrix;
}

function extractCommonSequence(leftLines: string[], rightLines: string[]) {
    const matrix = buildLcsMatrix(leftLines, rightLines);
    const sequence: Array<{ leftIndex: number; rightIndex: number }> = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < leftLines.length && rightIndex < rightLines.length) {
        if (leftLines[leftIndex] === rightLines[rightIndex]) {
            sequence.push({ leftIndex, rightIndex });
            leftIndex += 1;
            rightIndex += 1;
        } else if (matrix[leftIndex + 1][rightIndex] >= matrix[leftIndex][rightIndex + 1]) {
            leftIndex += 1;
        } else {
            rightIndex += 1;
        }
    }

    return sequence;
}

export function buildLineDiff(leftText: string, rightText: string) {
    const leftLines = leftText.split("\n");
    const rightLines = rightText.split("\n");
    const commonSequence = extractCommonSequence(leftLines, rightLines);
    const rows: DiffRow[] = [];

    let leftCursor = 0;
    let rightCursor = 0;

    for (const match of commonSequence) {
        while (leftCursor < match.leftIndex || rightCursor < match.rightIndex) {
            if (leftCursor < match.leftIndex && rightCursor < match.rightIndex) {
                rows.push({
                    leftLineNumber: leftCursor + 1,
                    rightLineNumber: rightCursor + 1,
                    leftText: leftLines[leftCursor],
                    rightText: rightLines[rightCursor],
                    type: leftLines[leftCursor] === rightLines[rightCursor] ? "same" : "removed",
                });
                leftCursor += 1;
                rightCursor += 1;
            } else if (leftCursor < match.leftIndex) {
                rows.push({
                    leftLineNumber: leftCursor + 1,
                    leftText: leftLines[leftCursor],
                    rightText: "",
                    type: "removed",
                });
                leftCursor += 1;
            } else {
                rows.push({
                    rightLineNumber: rightCursor + 1,
                    leftText: "",
                    rightText: rightLines[rightCursor],
                    type: "added",
                });
                rightCursor += 1;
            }
        }

        rows.push({
            leftLineNumber: match.leftIndex + 1,
            rightLineNumber: match.rightIndex + 1,
            leftText: leftLines[match.leftIndex],
            rightText: rightLines[match.rightIndex],
            type: "same",
        });
        leftCursor = match.leftIndex + 1;
        rightCursor = match.rightIndex + 1;
    }

    while (leftCursor < leftLines.length || rightCursor < rightLines.length) {
        if (leftCursor < leftLines.length && rightCursor < rightLines.length) {
            rows.push({
                leftLineNumber: leftCursor + 1,
                rightLineNumber: rightCursor + 1,
                leftText: leftLines[leftCursor],
                rightText: rightLines[rightCursor],
                type: leftLines[leftCursor] === rightLines[rightCursor] ? "same" : "removed",
            });
            leftCursor += 1;
            rightCursor += 1;
        } else if (leftCursor < leftLines.length) {
            rows.push({
                leftLineNumber: leftCursor + 1,
                leftText: leftLines[leftCursor],
                rightText: "",
                type: "removed",
            });
            leftCursor += 1;
        } else {
            rows.push({
                rightLineNumber: rightCursor + 1,
                leftText: "",
                rightText: rightLines[rightCursor],
                type: "added",
            });
            rightCursor += 1;
        }
    }

    return rows;
}

export function buildSectionDiff(
    leftSections: Array<{ heading: string; body: string }>,
    rightSections: Array<{ heading: string; body: string }>,
) {
    const leftMap = new Map(leftSections.map((section) => [section.heading.trim().toLowerCase(), section]));
    const rightMap = new Map(rightSections.map((section) => [section.heading.trim().toLowerCase(), section]));
    const allKeys = Array.from(new Set([...leftMap.keys(), ...rightMap.keys()]));

    return allKeys.map((key) => {
        const leftSection = leftMap.get(key);
        const rightSection = rightMap.get(key);
        const heading = leftSection?.heading || rightSection?.heading || "Untitled Section";

        if (leftSection && rightSection) {
            return {
                key,
                heading,
                type: leftSection.body.trim() === rightSection.body.trim() ? "same" : "changed",
                leftBody: leftSection.body,
                rightBody: rightSection.body,
            } satisfies SectionDiffRow;
        }

        if (leftSection) {
            return {
                key,
                heading,
                type: "removed",
                leftBody: leftSection.body,
                rightBody: "",
            } satisfies SectionDiffRow;
        }

        return {
            key,
            heading,
            type: "added",
            leftBody: "",
            rightBody: rightSection?.body || "",
        } satisfies SectionDiffRow;
    });
}
