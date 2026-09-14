import type { LegislativeMilestones } from './legislative-tracker';
import type { JurisdictionLevel } from './schemas/enums';

export type PaperSize = 'A4' | 'LEGAL' | 'LETTER';
export type FontFamily = 'Book Antiqua' | 'Times New Roman' | 'Arial';
export type LineSpacing = 1.15 | 1.5 | 2.0;

export interface DocumentSignatories {
  secretaryName: string;
  secretaryTitle: string;
  presidingOfficerName: string;
  presidingOfficerTitle: string;
  chiefExecutiveName: string;
  chiefExecutiveTitle: string;
  approvalDate?: string;
  [key: string]: unknown;
}

export interface DocumentSessionDetails {
  sessionType: 'REGULAR' | 'SPECIAL';
  sessionDate: string;
  sessionVenue: string;
  presentMembers: string[];
  absentMembers: string[];
  [key: string]: unknown;
}

export interface DocumentFormatConfig {
  paperSize: PaperSize;
  fontFamily: FontFamily;
  fontSizePt: number;
  lineSpacing: LineSpacing;
  includeSeals: boolean;
  includeSessionExcerpt: boolean;
  includeSignatures: boolean;
  includeQrVerification: boolean;
  signatories: DocumentSignatories;
  sessionDetails?: DocumentSessionDetails;
  [key: string]: unknown;
}

export interface FormattedDocumentData {
  title: string;
  enactmentNumber?: string;
  documentType: string;
  jurisdiction: JurisdictionLevel;
  jurisdictionName: string;
  body: string;
  sections?: Array<{ id: string; heading: string; body: string }>;
  verificationHash?: string;
  verificationUrl?: string;
  version?: number;
  [key: string]: unknown;
}

export function inferSanggunianBodyName(
  jurisdiction: JurisdictionLevel,
  jurisdictionName: string,
): { legislativeBody: string; officeName: string; enactingClauseBody: string } {
  const cleanName = jurisdictionName.trim().toUpperCase();

  switch (jurisdiction) {
    case 'provincial':
      return {
        legislativeBody: `SANGGUNIANG PANLALAWIGAN`,
        officeName: `OFFICE OF THE SANGGUNIANG PANLALAWIGAN`,
        enactingClauseBody: `BE IT ORDAINED BY THE SANGGUNIANG PANLALAWIGAN OF ${cleanName}, IN SESSION DULY ASSEMBLED:`,
      };
    case 'city':
      return {
        legislativeBody: `SANGGUNIANG PANLUNGSOD`,
        officeName: `OFFICE OF THE SANGGUNIANG PANLUNGSOD`,
        enactingClauseBody: `BE IT ORDAINED BY THE SANGGUNIANG PANLUNGSOD OF ${cleanName}, IN SESSION DULY ASSEMBLED:`,
      };
    case 'municipal':
      return {
        legislativeBody: `SANGGUNIANG BAYAN`,
        officeName: `OFFICE OF THE SANGGUNIANG BAYAN`,
        enactingClauseBody: `BE IT ORDAINED BY THE SANGGUNIANG BAYAN OF ${cleanName}, IN SESSION DULY ASSEMBLED:`,
      };
    case 'barangay':
      return {
        legislativeBody: `SANGGUNIANG BARANGAY`,
        officeName: `OFFICE OF THE SANGGUNIANG BARANGAY`,
        enactingClauseBody: `BE IT ORDAINED BY THE SANGGUNIANG BARANGAY OF ${cleanName}, IN SESSION DULY ASSEMBLED:`,
      };
    default:
      return {
        legislativeBody: `SANGGUNIAN`,
        officeName: `OFFICE OF THE SANGGUNIAN`,
        enactingClauseBody: `BE IT ORDAINED BY THE SANGGUNIAN OF ${cleanName}, IN SESSION DULY ASSEMBLED:`,
      };
  }
}

export function inferDefaultSignatories(
  jurisdiction: JurisdictionLevel,
  jurisdictionName: string,
): DocumentSignatories {
  const lgu = jurisdictionName.trim();
  const titles: Record<JurisdictionLevel, [string, string, string]> = {
    provincial: ['Secretary to the Sangguniang Panlalawigan', 'Provincial Vice Governor & Presiding Officer', `Provincial Governor, Province of ${lgu}`],
    city: ['Secretary to the Sangguniang Panlungsod', 'City Vice Mayor & Presiding Officer', `City Mayor, City of ${lgu}`],
    municipal: ['Secretary to the Sangguniang Bayan', 'Municipal Vice Mayor & Presiding Officer', `Municipal Mayor, Municipality of ${lgu}`],
    barangay: ['Barangay Secretary', 'Punong Barangay & Presiding Officer', `Punong Barangay, Barangay ${lgu}`],
  };
  const [secretaryTitle, presidingOfficerTitle, chiefExecutiveTitle] = titles[jurisdiction];
  return {
    secretaryName: '', secretaryTitle,
    presidingOfficerName: '', presidingOfficerTitle,
    chiefExecutiveName: '', chiefExecutiveTitle,
  };
}

export function buildDefaultDocumentFormatConfig(
  jurisdiction: JurisdictionLevel,
  jurisdictionName: string,
  milestones?: LegislativeMilestones,
): DocumentFormatConfig {
  const signatories = inferDefaultSignatories(jurisdiction, jurisdictionName);
  if (
    milestones?.lceAction === 'APPROVED' &&
    milestones.enactmentBasis === 'LCE_APPROVAL' &&
    milestones.lceActionDate
  ) {
    signatories.approvalDate = milestones.lceActionDate;
  }

  return {
    paperSize: 'A4',
    fontFamily: 'Book Antiqua',
    fontSizePt: 11,
    lineSpacing: 1.15,
    includeSeals: true,
    includeSessionExcerpt: false,
    includeSignatures: false,
    includeQrVerification: false,
    signatories,
    sessionDetails: {
      sessionType: 'REGULAR',
      sessionDate: milestones?.thirdReadingDate || milestones?.firstReadingDate || '',
      sessionVenue: '',
      presentMembers: [],
      absentMembers: [],
    },
  };
}

export interface ParsedOrdinanceStructure {
  whereAsClauses: string[];
  enactingClause: string;
  sections: Array<{ heading: string; body: string }>;
}

export function extractWhereAsClausesAndBody(draftBody: string): ParsedOrdinanceStructure {
  const lines = draftBody.split('\n');
  const whereAsClauses: string[] = [];
  let enactingClause = '';
  const sections: Array<{ heading: string; body: string }> = [];

  let currentHeading = '';
  let currentBodyLines: string[] = [];
  let isParsingSections = false;

  const pushSection = () => {
    if (!currentHeading) return;
    sections.push({
      heading: currentHeading.replace(/\s*(?:\.\s*)?[—–-]\s*$/, '').replace(/\.\s*$/, '').trim(),
      body: currentBodyLines.join('\n').trim().replace(/^[—–-]\s*/, ''),
    });
    currentBodyLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? '';
    const line = rawLine.trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();

    // Check for WHEREAS clauses
    if (lowerLine.startsWith('whereas') && !isParsingSections) {
      whereAsClauses.push(line);
      continue;
    }

    // Check for Enacting clause
    if (lowerLine.includes('be it ordained') || lowerLine.includes('be it resolved')) {
      enactingClause = line;
      isParsingSections = true;
      continue;
    }

    // Check for Section headers (e.g. "Section 1.", "SECTION 2 -", "## Section 1")
    const sectionMatch = line.match(/^(?:##\s*|#\s*)?(SECTION\s+\d+[.:-]?\s*[^.]*?)\.\s*(.*)$/i);
    if (sectionMatch) {
      if (currentHeading) pushSection();
      currentHeading = sectionMatch[1]?.trim() ?? 'SECTION';
      const remainder = sectionMatch[2]?.trim();
      if (remainder) {
        currentBodyLines.push(remainder);
      }
      isParsingSections = true;
      continue;
    }

    if (isParsingSections) {
      currentBodyLines.push(rawLine);
    } else {
      // Unclassified preamble or general text
      if (!currentHeading) {
        currentHeading = 'PROVISIONS';
      }
      currentBodyLines.push(rawLine);
    }
  }

  pushSection();

  return {
    whereAsClauses,
    enactingClause,
    sections,
  };
}

export function generateOfficialDocumentText(data: FormattedDocumentData, config: DocumentFormatConfig): string {
  const { legislativeBody, officeName, enactingClauseBody } = inferSanggunianBodyName(
    data.jurisdiction,
    data.jurisdictionName,
  );
  const parsed = extractWhereAsClausesAndBody(data.body);

  const lines: string[] = ['WORKING DRAFT — NOT AN OFFICIAL RECORD\n'];

  // 1. Optional government-style header
  if (config.includeSeals) {
    lines.push('REPUBLIC OF THE PHILIPPINES');
    lines.push(data.jurisdictionName.toUpperCase());
    lines.push(officeName);
    lines.push('------------------------------------------------------------\n');
  }

  // 2. Session Minutes Excerpt
  if (config.includeSessionExcerpt && config.sessionDetails) {
    lines.push(
      `DRAFT SESSION DETAILS — NOT VERIFIED AGAINST OFFICIAL MINUTES\n${config.sessionDetails.sessionType} SESSION OF THE ${legislativeBody}; VENUE: ${config.sessionDetails.sessionVenue.toUpperCase() || 'NOT PROVIDED'}; DATE: ${config.sessionDetails.sessionDate || 'NOT PROVIDED'}.\n`,
    );
    lines.push('PRESENT:');
    for (const member of config.sessionDetails.presentMembers) {
      lines.push(`  ${member}`);
    }
    if (config.sessionDetails.absentMembers.length > 0) {
      lines.push('\nABSENT:');
      for (const member of config.sessionDetails.absentMembers) {
        lines.push(`  ${member}`);
      }
    }
    lines.push('\n------------------------------------------------------------\n');
  }

  // 3. Document Title
  const enactmentLabel = data.enactmentNumber
    ? `${data.documentType.toUpperCase()} NO. ${data.enactmentNumber}\n\n`
    : '';
  lines.push(`${enactmentLabel}${data.title.toUpperCase()}\n`);

  // 4. WHEREAS Preamble
  if (parsed.whereAsClauses.length > 0) {
    for (const clause of parsed.whereAsClauses) {
      lines.push(`${clause}\n`);
    }
  }

  // 5. Enacting Clause
  lines.push(`${parsed.enactingClause || enactingClauseBody}\n`);

  // 6. Substantive Sections
  if (parsed.sections.length > 0) {
    for (const sec of parsed.sections) {
      lines.push(`${sec.heading}. — ${sec.body}\n`);
    }
  } else {
    lines.push(data.body);
  }

  // 7. Proposed signatory placeholders. These never assert signature, adoption, or approval.
  if (config.includeSignatures) {
    lines.push('\n------------------------------------------------------------');
    lines.push('DRAFT SIGNATORY PLACEHOLDERS — NO SIGNATURE OR APPROVAL IS RECORDED\n');
    lines.push(`Proposed Sanggunian Secretary: ${config.signatories.secretaryName.toUpperCase()}`);
    lines.push(`${config.signatories.secretaryTitle}\n`);
    lines.push(`Proposed Presiding Officer: ${config.signatories.presidingOfficerName.toUpperCase()}`);
    lines.push(`${config.signatories.presidingOfficerTitle}\n`);
    lines.push(`Proposed Local Chief Executive: ${config.signatories.chiefExecutiveName.toUpperCase()}`);
    lines.push(`${config.signatories.chiefExecutiveTitle}\n`);
  }

  lines.push('\nThis export has not been authenticated or legally certified by LexiGov.');

  return lines.join('\n');
}
