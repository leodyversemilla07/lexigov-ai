export type ComplianceIssueType = "critical" | "warning" | "suggestion";

export interface ComplianceIssue {
    type: ComplianceIssueType;
    section?: string;
    title: string;
    description: string;
    suggestion: string;
}

export interface ComplianceResult {
    overallScore: number;
    isValid: boolean;
    issues: ComplianceIssue[];
}

type JurisdictionLevel = "barangay" | "municipal" | "city" | "provincial";

type PenaltyRule = {
    fineLimit?: number;
    imprisonmentMonthsLimit?: number;
    imprisonmentAllowed: boolean;
};

const PENALTY_RULES: Record<JurisdictionLevel, PenaltyRule> = {
    // RA 7160, Section 391(a)(14)
    barangay: {
        fineLimit: 1000,
        imprisonmentAllowed: false,
    },
    // RA 7160, Section 447(a)(1)(iii)
    municipal: {
        fineLimit: 2500,
        imprisonmentMonthsLimit: 6,
        imprisonmentAllowed: true,
    },
    // RA 7160, Section 458(a)(1)(iii)
    city: {
        fineLimit: 5000,
        imprisonmentMonthsLimit: 12,
        imprisonmentAllowed: true,
    },
    // RA 7160, Section 468(a)(1)(iii)
    provincial: {
        fineLimit: 5000,
        imprisonmentMonthsLimit: 12,
        imprisonmentAllowed: true,
    },
};

const MAX_ISSUES = 8;

function normalizeWhitespace(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function normalizeCurrency(value: string) {
    return value.replace(/[, ]/g, "");
}

function readFineAmounts(content: string) {
    const matches = Array.from(
        content.matchAll(
            /(?:fine(?:s)?|penalt(?:y|ies)|multa(?:han)?)[^.\n]{0,80}?(?:₱|PHP|P)\s*([\d,]+(?:\.\d{1,2})?)/gi,
        ),
    );

    return matches
        .map((match) => Number.parseFloat(normalizeCurrency(match[1])))
        .filter((value) => Number.isFinite(value));
}

function readImprisonmentMonths(content: string) {
    const matches = Array.from(
        content.matchAll(
            /(?:imprisonment|jail(?:\s+term)?|incarceration)[^.\n]{0,80}?(\d+)\s*(day|days|month|months|year|years)/gi,
        ),
    );

    return matches
        .map((match) => {
            const quantity = Number.parseInt(match[1], 10);
            const unit = match[2].toLowerCase();

            if (unit.startsWith("day")) {
                return quantity / 30;
            }
            if (unit.startsWith("year")) {
                return quantity * 12;
            }

            return quantity;
        })
        .filter((value) => Number.isFinite(value));
}

function clampScore(score: number) {
    return Math.max(0, Math.min(100, score));
}

function computeScore(issues: ComplianceIssue[]) {
    const deduction = issues.reduce((total, issue) => {
        switch (issue.type) {
            case "critical":
                return total + 25;
            case "warning":
                return total + 10;
            case "suggestion":
                return total + 4;
        }
    }, 0);

    return clampScore(100 - deduction);
}

function canonicalIssueKey(issue: ComplianceIssue) {
    return `${issue.type}:${issue.section ?? ""}:${issue.title}`.toLowerCase();
}

function createResult(issues: ComplianceIssue[]): ComplianceResult {
    const slicedIssues = issues.slice(0, MAX_ISSUES);
    const overallScore = computeScore(slicedIssues);

    return {
        overallScore,
        isValid: !slicedIssues.some((issue) => issue.type === "critical"),
        issues: slicedIssues,
    };
}

export function mergeComplianceIssues(
    baseIssues: ComplianceIssue[],
    extraIssues: ComplianceIssue[],
) {
    const seen = new Set(baseIssues.map(canonicalIssueKey));
    const merged = [...baseIssues];

    for (const issue of extraIssues) {
        const key = canonicalIssueKey(issue);
        if (seen.has(key)) {
            continue;
        }

        merged.push(issue);
        seen.add(key);

        if (merged.length >= MAX_ISSUES) {
            break;
        }
    }

    return merged;
}

export function analyzeDeterministicCompliance(
    content: string,
    jurisdiction: JurisdictionLevel,
): ComplianceResult {
    const normalized = normalizeWhitespace(content);
    const lower = normalized.toLowerCase();
    const issues: ComplianceIssue[] = [];
    const hasSections = /section\s+\d+/i.test(content);
    const hasHeader = /republic of the philippines/i.test(content);
    const hasWhereas = /\bwhereas\b/i.test(content);
    const hasSeparability = /separability/i.test(content);
    const hasRepealing = /repeal(?:ing)?/i.test(content);
    const hasEffectivity = /effectivit|take effect/i.test(content);
    const mentionsPenalty = /\b(fine|penalt(?:y|ies)|imprisonment|jail)\b/i.test(content);
    const mentionsPosting = /\bpost(?:ed|ing)?\b/i.test(content);
    const mentionsPublication = /\bpublish(?:ed|ing|ation)\b/i.test(content);
    const mentionsHearing = /\b(notice|hearing|appeal)\b/i.test(content);

    if (!hasHeader) {
        issues.push({
            type: "warning",
            section: "Header",
            title: "Missing national and local header",
            description: "The draft does not clearly state the Republic of the Philippines header or equivalent ordinance heading.",
            suggestion: "Add the formal ordinance header with the Republic of the Philippines and the issuing LGU.",
        });
    }

    if (!hasWhereas) {
        issues.push({
            type: "warning",
            section: "Preamble",
            title: "Missing WHEREAS clauses",
            description: "The draft does not include WHEREAS clauses or a comparable legal basis recital.",
            suggestion: "Add WHEREAS clauses that cite the legal basis, factual context, and policy rationale.",
        });
    }

    if (!hasSections) {
        issues.push({
            type: "critical",
            section: "Body",
            title: "Missing numbered sections",
            description: "The ordinance body does not use clearly numbered sections, which weakens structure and enforceability.",
            suggestion: "Reformat the body into numbered sections with headings and discrete operative provisions.",
        });
    }

    if (!hasSeparability) {
        issues.push({
            type: "warning",
            section: "Final Provisions",
            title: "Missing separability clause",
            description: "The draft does not include a separability clause.",
            suggestion: "Add a separability clause stating that invalid provisions do not affect the remainder of the ordinance.",
        });
    }

    if (!hasRepealing) {
        issues.push({
            type: "warning",
            section: "Final Provisions",
            title: "Missing repealing clause",
            description: "The draft does not include a repealing clause or any statement on inconsistent prior issuances.",
            suggestion: "Add a repealing clause addressing inconsistent ordinances, orders, or regulations.",
        });
    }

    if (!hasEffectivity) {
        issues.push({
            type: "critical",
            section: "Final Provisions",
            title: "Missing effectivity clause",
            description: "The draft does not state when the ordinance takes effect.",
            suggestion: "Add an effectivity clause that aligns with the applicable posting and publication requirements.",
        });
    }

    if (mentionsPenalty && !mentionsPosting && !mentionsPublication) {
        issues.push({
            type: "warning",
            section: "Penal Provisions",
            title: "Penal sanctions lack publication or posting guidance",
            description: "The draft appears to impose penalties but does not mention publication or posting requirements tied to penal ordinances.",
            suggestion: "Add effectivity language that acknowledges the required posting and publication steps for penal ordinances.",
        });
    }

    if (!mentionsHearing && /permit|license|closure|suspension|revocation|confiscat/i.test(lower)) {
        issues.push({
            type: "suggestion",
            section: "Enforcement",
            title: "Limited due process language",
            description: "The draft regulates permits or enforcement actions but does not clearly mention notice, hearing, or appeal procedures.",
            suggestion: "Add due process language for notices, hearings, and available administrative remedies before penalties are imposed.",
        });
    }

    const rule = PENALTY_RULES[jurisdiction];
    const fineAmounts = readFineAmounts(content);
    const maxFine = fineAmounts.length > 0 ? Math.max(...fineAmounts) : undefined;

    if (maxFine !== undefined && rule.fineLimit !== undefined && maxFine > rule.fineLimit) {
        issues.push({
            type: "critical",
            section: "Penal Provisions",
            title: "Penalty fine exceeds jurisdiction limit",
            description: `The draft mentions a fine of P${maxFine.toLocaleString()}, which is above the apparent ${jurisdiction} ordinance limit of P${rule.fineLimit.toLocaleString()}.`,
            suggestion: `Reduce the fine to P${rule.fineLimit.toLocaleString()} or below, unless another legal basis clearly authorizes a higher amount.`,
        });
    }

    const imprisonmentMonths = readImprisonmentMonths(content);
    const maxImprisonmentMonths = imprisonmentMonths.length > 0 ? Math.max(...imprisonmentMonths) : undefined;

    if (!rule.imprisonmentAllowed && maxImprisonmentMonths !== undefined) {
        issues.push({
            type: "critical",
            section: "Penal Provisions",
            title: "Imprisonment appears unauthorized for this jurisdiction",
            description: "The draft mentions imprisonment even though barangay ordinances generally prescribe fines rather than jail terms.",
            suggestion: "Remove the imprisonment penalty or cite a specific legal basis that authorizes it.",
        });
    } else if (
        maxImprisonmentMonths !== undefined &&
        rule.imprisonmentMonthsLimit !== undefined &&
        maxImprisonmentMonths > rule.imprisonmentMonthsLimit
    ) {
        const limitLabel = rule.imprisonmentMonthsLimit === 12
            ? "1 year"
            : `${rule.imprisonmentMonthsLimit} months`;

        issues.push({
            type: "critical",
            section: "Penal Provisions",
            title: "Imprisonment term exceeds jurisdiction limit",
            description: `The draft mentions imprisonment of roughly ${maxImprisonmentMonths} months, which is above the apparent ${jurisdiction} ordinance limit of ${limitLabel}.`,
            suggestion: `Reduce the imprisonment term to ${limitLabel} or below, unless another legal basis clearly authorizes a higher amount.`,
        });
    }

    if (mentionsPenalty && fineAmounts.length === 0 && maxImprisonmentMonths === undefined) {
        issues.push({
            type: "suggestion",
            section: "Penal Provisions",
            title: "Penalty language is not specific",
            description: "The draft refers to penalties but does not clearly express the sanction amount or duration.",
            suggestion: "State the exact fine range or imprisonment term, subject to the jurisdiction's statutory limits.",
        });
    }

    return createResult(issues);
}

export function buildComplianceResultFromIssues(issues: ComplianceIssue[]) {
    return createResult(issues);
}
