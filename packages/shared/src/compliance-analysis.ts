export type ComplianceIssueType = 'critical' | 'warning' | 'suggestion';

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

/**
 * Coerce an AI provider payload into a canonical ComplianceIssue.
 * Tolerates provider-specific field names (e.g. `violation`, `message`,
 * `legalBasis`) so a loosely-typed model response can still be merged safely.
 */
export function toComplianceIssue(raw: unknown): ComplianceIssue | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const rawType = typeof record.type === 'string' ? record.type.toLowerCase() : '';
  const type: ComplianceIssueType =
    rawType === 'violation' ? 'critical' : (rawType as ComplianceIssueType) || 'suggestion';

  const rawTitle =
    typeof record.title === 'string'
      ? record.title.trim()
      : typeof record.message === 'string'
        ? record.message.trim()
        : '';
  const title = rawTitle || 'Compliance issue';
  const description =
    (typeof record.description === 'string' && record.description.trim()) ||
    (typeof record.message === 'string' ? record.message.trim() : '') ||
    title;
  const suggestion =
    (typeof record.suggestion === 'string' && record.suggestion.trim()) ||
    (typeof record.recommendation === 'string' ? record.recommendation : '') ||
    '';
  const section = typeof record.section === 'string' && record.section.trim() ? record.section.trim() : undefined;

  if (!title) {
    return null;
  }

  return { type, section, title, description, suggestion };
}

/**
 * Parse and normalize an AI compliance analysis payload into a ComplianceResult.
 * Returns null when the payload cannot be interpreted at all.
 */
export function parseComplianceResult(raw: unknown): ComplianceResult | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const issues = Array.isArray(record.issues)
    ? record.issues.map(toComplianceIssue).filter((i): i is ComplianceIssue => i !== null)
    : [];

  // The canonical contract reports issues only; a score is derived when absent.
  const overallScore =
    typeof record.overallScore === 'number' ? Math.max(0, Math.min(100, record.overallScore)) : computeScore(issues);
  const isValid =
    typeof record.isValid === 'boolean' ? record.isValid : !issues.some((issue) => issue.type === 'critical');

  if (issues.length === 0 && typeof record.overallScore !== 'number') {
    return null;
  }

  return { overallScore, isValid, issues };
}

type JurisdictionLevel = 'barangay' | 'municipal' | 'city' | 'provincial';

export const jurisdictionPenaltyGuidance: Record<JurisdictionLevel, string> = {
  barangay: 'Fine up to ₱1,000; barangay ordinances generally should not impose imprisonment',
  municipal: 'Fine up to ₱2,500 and imprisonment up to 6 months',
  city: 'Fine up to ₱5,000 and imprisonment up to 1 year',
  provincial: 'Fine up to ₱5,000 and imprisonment up to 1 year',
};

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

const ISSUE_SEVERITY_ORDER: Record<ComplianceIssueType, number> = {
  critical: 0,
  warning: 1,
  suggestion: 2,
};

/**
 * Canonical JSON Schema for AI compliance analysis responses.
 * Shared by every AI provider so the model is asked for a predictable payload.
 */
/**
 * JSON Schema for the AI compliance response. Mirrors the canonical
 * `aiComplianceResultSchema` contract: the model reports issues only, while the
 * review score and validity flag are computed by the application.
 */
export const complianceAnalysisJsonSchema = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      maxItems: MAX_ISSUES,
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['critical', 'warning', 'suggestion'] },
          section: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['type', 'title', 'description', 'suggestion'],
      },
    },
  },
  required: ['issues'],
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeCurrency(value: string) {
  return value.replace(/[, ]/g, '');
}

function readFineAmounts(content: string) {
  const matches = Array.from(
    content.matchAll(/(?:fine(?:s)?|penalt(?:y|ies)|multa(?:han)?)[^.\n]{0,80}?(?:₱|PHP|P)\s*([\d,]+(?:\.\d{1,2})?)/gi),
  );

  return matches
    .map((match) => {
      const amount = match[1];
      if (!amount) {
        return Number.NaN;
      }

      return Number.parseFloat(normalizeCurrency(amount));
    })
    .filter((value) => Number.isFinite(value));
}

function readImprisonmentMonths(content: string) {
  const numberWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    twelve: 12,
  };
  const matches = Array.from(
    content.matchAll(
      /(?:imprisonment|jail(?:\s+term)?|incarceration)[^.\n]{0,80}?(?:(one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s*)?(?:\(\s*)?(\d+)?(?:\s*\))?\s*(day|days|month|months|year|years)/gi,
    ),
  );

  return matches
    .map((match) => {
      const wordText = match[1]?.toLowerCase();
      const quantityText = match[2];
      const unitText = match[3];
      if (!unitText) return Number.NaN;

      let quantity: number;
      if (quantityText) {
        quantity = Number.parseInt(quantityText, 10);
      } else if (wordText) {
        quantity = numberWords[wordText] ?? Number.NaN;
      } else {
        return Number.NaN;
      }

      const unit = unitText.toLowerCase();

      if (unit.startsWith('day')) {
        return quantity / 30;
      }
      if (unit.startsWith('year')) {
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
      case 'critical':
        return total + 25;
      case 'warning':
        return total + 10;
      case 'suggestion':
        return total + 4;
      default:
        return total;
    }
  }, 0);

  return clampScore(100 - deduction);
}

function canonicalIssueKey(issue: ComplianceIssue) {
  return `${issue.type}:${issue.section ?? ''}:${issue.title}`.toLowerCase();
}

function createResult(issues: ComplianceIssue[]): ComplianceResult {
  const slicedIssues = issues.slice(0, MAX_ISSUES);
  const overallScore = computeScore(slicedIssues);

  return {
    overallScore,
    isValid: !slicedIssues.some((issue) => issue.type === 'critical'),
    issues: slicedIssues,
  };
}

export function mergeComplianceIssues(baseIssues: ComplianceIssue[], extraIssues: ComplianceIssue[]) {
  const seen = new Set(baseIssues.map(canonicalIssueKey));
  const merged = [...baseIssues];

  for (const issue of extraIssues) {
    const key = canonicalIssueKey(issue);
    if (seen.has(key)) {
      continue;
    }

    merged.push(issue);
    seen.add(key);
  }

  // Retain the highest-severity issues when capping the merged result.
  merged.sort((a, b) => ISSUE_SEVERITY_ORDER[a.type] - ISSUE_SEVERITY_ORDER[b.type]);

  // Cap the merged result once, after deterministic + AI issues have been combined.
  return merged.slice(0, MAX_ISSUES);
}

export function analyzeDeterministicCompliance(content: string, jurisdiction: JurisdictionLevel): ComplianceResult {
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
      type: 'warning',
      section: 'Header',
      title: 'Missing national and local header',
      description:
        'The draft does not clearly state the Republic of the Philippines header or equivalent ordinance heading.',
      suggestion: 'Add the formal ordinance header with the Republic of the Philippines and the issuing LGU.',
    });
  }

  if (!hasWhereas) {
    issues.push({
      type: 'warning',
      section: 'Preamble',
      title: 'Missing WHEREAS clauses',
      description: 'The draft does not include WHEREAS clauses or a comparable legal basis recital.',
      suggestion: 'Add WHEREAS clauses that cite the legal basis, factual context, and policy rationale.',
    });
  }

  if (!hasSections) {
    issues.push({
      type: 'critical',
      section: 'Body',
      title: 'Missing numbered sections',
      description:
        'The ordinance body does not use clearly numbered sections, which weakens structure and enforceability.',
      suggestion: 'Reformat the body into numbered sections with headings and discrete operative provisions.',
    });
  }

  if (!hasSeparability) {
    issues.push({
      type: 'warning',
      section: 'Final Provisions',
      title: 'Missing separability clause',
      description: 'The draft does not include a separability clause.',
      suggestion:
        'Add a separability clause stating that invalid provisions do not affect the remainder of the ordinance.',
    });
  }

  if (!hasRepealing) {
    issues.push({
      type: 'warning',
      section: 'Final Provisions',
      title: 'Missing repealing clause',
      description: 'The draft does not include a repealing clause or any statement on inconsistent prior issuances.',
      suggestion: 'Add a repealing clause addressing inconsistent ordinances, orders, or regulations.',
    });
  }

  if (!hasEffectivity) {
    issues.push({
      type: 'critical',
      section: 'Final Provisions',
      title: 'Missing effectivity clause',
      description: 'The draft does not state when the ordinance takes effect.',
      suggestion: 'Add an effectivity clause that aligns with the applicable posting and publication requirements.',
    });
  }

  if (mentionsPenalty && !mentionsPosting && !mentionsPublication) {
    issues.push({
      type: 'warning',
      section: 'Penal Provisions',
      title: 'Penal sanctions lack publication or posting guidance',
      description:
        'The draft appears to impose penalties but does not mention publication or posting requirements tied to penal ordinances.',
      suggestion:
        'Add effectivity language that acknowledges the required posting and publication steps for penal ordinances.',
    });
  }

  if (!mentionsHearing && /permit|license|closure|suspension|revocation|confiscat/i.test(lower)) {
    issues.push({
      type: 'suggestion',
      section: 'Enforcement',
      title: 'Limited due process language',
      description:
        'The draft regulates permits or enforcement actions but does not clearly mention notice, hearing, or appeal procedures.',
      suggestion:
        'Add due process language for notices, hearings, and available administrative remedies before penalties are imposed.',
    });
  }

  const rule = PENALTY_RULES[jurisdiction];
  const fineAmounts = readFineAmounts(content);
  const maxFine = fineAmounts.length > 0 ? Math.max(...fineAmounts) : undefined;

  if (maxFine !== undefined && rule.fineLimit !== undefined && maxFine > rule.fineLimit) {
    issues.push({
      type: 'critical',
      section: 'Penal Provisions',
      title: 'Penalty fine exceeds jurisdiction limit',
      description: `The draft mentions a fine of P${maxFine.toLocaleString()}, which is above the apparent ${jurisdiction} ordinance limit of P${rule.fineLimit.toLocaleString()}.`,
      suggestion: `Reduce the fine to P${rule.fineLimit.toLocaleString()} or below, unless another legal basis clearly authorizes a higher amount.`,
    });
  }

  const imprisonmentMonths = readImprisonmentMonths(content);
  const maxImprisonmentMonths = imprisonmentMonths.length > 0 ? Math.max(...imprisonmentMonths) : undefined;

  if (!rule.imprisonmentAllowed && maxImprisonmentMonths !== undefined) {
    issues.push({
      type: 'critical',
      section: 'Penal Provisions',
      title: 'Imprisonment appears unauthorized for this jurisdiction',
      description:
        'The draft mentions imprisonment even though barangay ordinances generally prescribe fines rather than jail terms.',
      suggestion: 'Remove the imprisonment penalty or cite a specific legal basis that authorizes it.',
    });
  } else if (
    maxImprisonmentMonths !== undefined &&
    rule.imprisonmentMonthsLimit !== undefined &&
    maxImprisonmentMonths > rule.imprisonmentMonthsLimit
  ) {
    const limitLabel = rule.imprisonmentMonthsLimit === 12 ? '1 year' : `${rule.imprisonmentMonthsLimit} months`;

    issues.push({
      type: 'critical',
      section: 'Penal Provisions',
      title: 'Imprisonment term exceeds jurisdiction limit',
      description: `The draft mentions imprisonment of roughly ${maxImprisonmentMonths} months, which is above the apparent ${jurisdiction} ordinance limit of ${limitLabel}.`,
      suggestion: `Reduce the imprisonment term to ${limitLabel} or below, unless another legal basis clearly authorizes a higher amount.`,
    });
  }

  if (mentionsPenalty && fineAmounts.length === 0 && maxImprisonmentMonths === undefined) {
    issues.push({
      type: 'suggestion',
      section: 'Penal Provisions',
      title: 'Penalty language is not specific',
      description: 'The draft refers to penalties but does not clearly express the sanction amount or duration.',
      suggestion: "State the exact fine range or imprisonment term, subject to the jurisdiction's statutory limits.",
    });
  }

  // RA 7160, Sections 186-188: Tax and Revenue Measures
  const isTaxOrRevenue =
    /\b(tax|taxes|taxation|regulatory fee|user charge|levy|levies|franchise tax|real property tax)\b/i.test(content);
  const mentionsPublicHearing = /\b(public hearing|public consultation|consultative assembly)\b/i.test(content);
  const mentionsTaxPublication =
    /\b(newspaper of (?:general|local) circulation|consecutive days|posted in (?:at least )?(?:two|2) (?:conspicuous|prominent) places)\b/i.test(
      content,
    );

  if (isTaxOrRevenue) {
    if (!mentionsPublicHearing) {
      issues.push({
        type: 'warning',
        section: 'Legislative Procedure',
        title: 'Tax/revenue measure lacks public hearing recital',
        description: 'Tax and revenue ordinances require prior public hearings pursuant to RA 7160, Section 187.',
        suggestion:
          'Confirm and document the required public-hearing process. Add a recital only after the hearing has actually occurred and the statement has been verified.',
      });
    }

    if (jurisdiction !== 'barangay' && !mentionsTaxPublication) {
      issues.push({
        type: 'warning',
        section: 'Final Provisions',
        title: 'Tax ordinance requires special publication/posting review',
        description:
          'RA 7160 Section 188 requires certified true copies of provincial, city, and municipal tax ordinances or revenue measures to be published in full within 10 days after approval for 3 consecutive days in a newspaper of local circulation. Where no such newspaper exists, posting in at least 2 conspicuous and publicly accessible places is the statutory alternative.',
        suggestion:
          'Have authorized counsel confirm the applicable Section 188 publication or alternative-posting process; do not represent that publication or posting has occurred until it is documented.',
      });
    }
  }

  // RA 10121, Section 21: current LDRRMF minimum for local appropriations
  const isAppropriation =
    /\b(annual budget|supplemental budget|appropriation ordinance|appropriating the (?:amount|sum))\b/i.test(content);
  const mentionsCalamityFund = /\b(calamity fund|ldrr?mf|disaster risk reduction|5%|five percent)\b/i.test(content);

  if (isAppropriation) {
    if (!mentionsCalamityFund) {
      issues.push({
        type: 'warning',
        section: 'Appropriation Provisions',
        title: 'Mandatory 5% Calamity / LDRRMF set-aside check',
        description:
          'RA 10121 Section 21 requires an LDRRM Fund of not less than 5% of estimated revenue from regular sources.',
        suggestion:
          'Confirm the current budget base and applicable accounting guidance, then include the required LDRRMF allocation for authorized review.',
      });
    }
  }

  // RA 7160, Sections 54-57: Sanggunian Review Transmittal
  const mentionsTransmittal =
    /\b(transmitt(?:ed|al)|sangguniang (?:panlalawigan|panlungsod|bayan)|review within|secretary to the sanggunian)\b/i.test(
      content,
    );

  if (jurisdiction === 'barangay' && !mentionsTransmittal) {
    issues.push({
      type: 'suggestion',
      section: 'Review & Transmittal',
      title: 'Barangay ordinance transmittal to city/municipal Sanggunian',
      description:
        'Under RA 7160 Section 57, barangay ordinances must be submitted to the Sangguniang Bayan or Sangguniang Panlungsod within 10 days of enactment.',
      suggestion:
        'Add a transmittal instruction directing the Barangay Secretary to forward copies to the higher Sanggunian for review.',
    });
  } else if (jurisdiction === 'municipal' && !mentionsTransmittal) {
    issues.push({
      type: 'suggestion',
      section: 'Review & Transmittal',
      title: 'Municipal ordinance transmittal to Sangguniang Panlalawigan',
      description:
        'Under RA 7160 Section 56, municipal ordinances must be submitted to the Sangguniang Panlalawigan for review of ultra vires acts within 3 days of approval.',
      suggestion:
        'Add a provision directing the Sanggunian Secretary to forward approved copies to the Sangguniang Panlalawigan.',
    });
  }

  return createResult(issues);
}

export function buildComplianceResultFromIssues(issues: ComplianceIssue[]) {
  const validIssues = issues.filter(
    (issue) =>
      issue &&
      ['critical', 'warning', 'suggestion'].includes(issue.type) &&
      typeof issue.title === 'string' &&
      issue.title.length > 0 &&
      typeof issue.description === 'string' &&
      issue.description.length > 0 &&
      typeof issue.suggestion === 'string' &&
      issue.suggestion.length > 0,
  );
  if (validIssues.length !== issues.length) {
    validIssues.push({
      type: 'critical',
      section: 'Analysis',
      title: 'Compliance analysis response was invalid',
      description: 'One or more reported issues did not match the validated compliance contract.',
      suggestion: 'Repeat the review and have an authorized legal officer inspect the draft manually.',
    });
  }
  return createResult(validIssues);
}
