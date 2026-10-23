import type { JurisdictionLevel, SanggunianRole } from './schemas/enums';

export type LegislativeStage =
  | 'DRAFTING'
  | 'FIRST_READING'
  | 'COMMITTEE_REVIEW'
  | 'SECOND_READING'
  | 'THIRD_READING'
  | 'TRANSMITTED_TO_LCE'
  | 'AWAITING_PUNONG_BARANGAY_SIGNATURE'
  | 'ADOPTED'
  | 'ENACTED'
  | 'VETOED'
  | 'LAPSED_INTO_LAW';

export type EnactmentBasis = 'LCE_APPROVAL' | 'VETO_OVERRIDE' | 'DEEMED_APPROVED' | 'BARANGAY_MAJORITY_AND_SIGNATURE';

export interface VotingRecord {
  totalMembership?: number;
  membersPresent?: number;
  ayes: number;
  nays: number;
  abstentions: number;
  rollCallRecorded?: boolean;
  [key: string]: unknown;
}

export interface LegislativeMilestones {
  currentStage: LegislativeStage;
  firstReadingDate?: string;
  sponsorName?: string;
  referredCommittee?: string;
  committeeHearingDate?: string;
  committeeReportNo?: string;
  secondReadingDate?: string;
  periodOfAmendmentsDate?: string;
  thirdReadingDate?: string;
  votingRecord?: VotingRecord;
  transmittedDate?: string;
  transmittalDeadline?: string;
  lceAction?: 'APPROVED' | 'VETOED' | 'LAPSED_INTO_LAW' | 'PENDING';
  lceActionDate?: string;
  vetoMessageReference?: string;
  vetoOverrideDate?: string;
  vetoOverrideVotingRecord?: VotingRecord;
  punongBarangaySignatureDate?: string;
  enactmentBasis?: EnactmentBasis;
  enactmentNo?: string;
  [key: string]: unknown;
}

export interface LegislativeStageMetadata {
  stage: LegislativeStage;
  label: string;
  description: string;
  stepNumber: number;
}

export const LEGISLATIVE_STAGES: LegislativeStageMetadata[] = [
  {
    stage: 'DRAFTING',
    label: 'Preparation & Drafting',
    description: 'Prepare the working draft and record internal review before formal filing.',
    stepNumber: 1,
  },
  {
    stage: 'FIRST_READING',
    label: 'First Reading Recorded',
    description: 'Record the title reading and referral shown by the relevant legislative record.',
    stepNumber: 2,
  },
  {
    stage: 'COMMITTEE_REVIEW',
    label: 'Committee Review',
    description: 'Record committee action and any hearing or consultation that is supported by evidence.',
    stepNumber: 3,
  },
  {
    stage: 'SECOND_READING',
    label: 'Second Reading Recorded',
    description: 'Record the deliberation and amendment milestone shown by the legislative record.',
    stepNumber: 4,
  },
  {
    stage: 'THIRD_READING',
    label: 'Third Reading & Vote Recorded',
    description: 'Record the date, membership, quorum, and nominal vote without treating the entry as certification.',
    stepNumber: 5,
  },
  {
    stage: 'TRANSMITTED_TO_LCE',
    label: 'Transmitted to Mayor/Governor',
    description: 'Record transmittal of an ordinance for action under RA 7160 Section 54(a)–(b).',
    stepNumber: 6,
  },
  {
    stage: 'AWAITING_PUNONG_BARANGAY_SIGNATURE',
    label: 'Awaiting Punong Barangay Signature',
    description: 'Record the post-vote signature step for a barangay ordinance under RA 7160 Section 54(c).',
    stepNumber: 6,
  },
  {
    stage: 'VETOED',
    label: 'Veto Recorded',
    description: 'A veto and written-objection reference have been recorded; any override requires separate evidence.',
    stepNumber: 7,
  },
  {
    stage: 'ADOPTED',
    label: 'Adoption Recorded',
    description: 'The recorded vote indicates adoption of the proposed resolution; this is not official certification.',
    stepNumber: 6,
  },
  {
    stage: 'ENACTED',
    label: 'Enactment Recorded',
    description:
      'An approval, barangay signature, or veto-override basis has been recorded but not independently verified.',
    stepNumber: 7,
  },
  {
    stage: 'LAPSED_INTO_LAW',
    label: 'Deemed Approval Recorded',
    description:
      'Reserved for a separately verified statutory deadline and review process; unavailable in draft editing.',
    stepNumber: 7,
  },
];

export function getLegislativeStages(
  jurisdiction: JurisdictionLevel,
  documentType = 'ORDINANCE',
): LegislativeStageMetadata[] {
  const normalizedType = documentType.toUpperCase();
  if (!['ORDINANCE', 'RESOLUTION'].includes(normalizedType)) {
    return LEGISLATIVE_STAGES.filter((item) => item.stage === 'DRAFTING');
  }
  if (normalizedType === 'RESOLUTION') {
    return LEGISLATIVE_STAGES.filter((item) =>
      ['DRAFTING', 'FIRST_READING', 'COMMITTEE_REVIEW', 'SECOND_READING', 'THIRD_READING', 'ADOPTED'].includes(
        item.stage,
      ),
    );
  }

  if (jurisdiction === 'barangay') {
    return LEGISLATIVE_STAGES.filter((item) =>
      [
        'DRAFTING',
        'FIRST_READING',
        'COMMITTEE_REVIEW',
        'SECOND_READING',
        'THIRD_READING',
        'AWAITING_PUNONG_BARANGAY_SIGNATURE',
        'ENACTED',
      ].includes(item.stage),
    );
  }

  return LEGISLATIVE_STAGES.filter((item) =>
    [
      'DRAFTING',
      'FIRST_READING',
      'COMMITTEE_REVIEW',
      'SECOND_READING',
      'THIRD_READING',
      'TRANSMITTED_TO_LCE',
      'VETOED',
      'ENACTED',
    ].includes(item.stage),
  );
}

export function calculateTransmittalDeadline(transmittedDateStr: string, jurisdiction: JurisdictionLevel): string {
  if (jurisdiction === 'barangay') return '';
  const date = parseDate(transmittedDateStr);
  if (!date) return '';

  // RA 7160 Section 54(b) states 15 days for a province and 10 days for a city or municipality.
  // This calendar-date calculation is an aid only; authorized counsel must verify legal time computation.
  const daysLimit = jurisdiction === 'provincial' ? 15 : 10;
  date.setUTCDate(date.getUTCDate() + daysLimit);
  return date.toISOString().slice(0, 10);
}

export function getDefaultMilestones(): LegislativeMilestones {
  return {
    currentStage: 'DRAFTING',
    votingRecord: {
      totalMembership: 0,
      membersPresent: 0,
      ayes: 0,
      nays: 0,
      abstentions: 0,
      rollCallRecorded: false,
    },
    lceAction: 'PENDING',
  };
}

export const SANGGUNIAN_ROLE_LABELS: Record<
  SanggunianRole,
  { label: string; statutoryTitle: string; description: string }
> = {
  LGU_ADMIN: {
    label: 'LGU Administrator',
    statutoryTitle: 'Workspace & System Administrator',
    description:
      'Administers organization drafts and role assignments; this role does not itself prove legal authority.',
  },
  LEGISLATIVE_STAFF: {
    label: 'Legislative Staff / Researcher',
    statutoryTitle: 'Legislative Drafting Workspace Role',
    description: 'Prepares working drafts and research notes without certifying legislative events.',
  },
  COMMITTEE_CHAIR: {
    label: 'Committee Chairperson',
    statutoryTitle: 'Committee Chair Workspace Role',
    description: 'Records committee-stage information supported by the organization’s source records.',
  },
  SANGGUNIAN_SECRETARY: {
    label: 'Secretary to the Sanggunian',
    statutoryTitle: 'Sanggunian Secretary (RA 7160 § 469)',
    description: 'Records legislative milestones; entries remain unverified workspace data, not official journals.',
  },
  PRESIDING_OFFICER: {
    label: 'Presiding Officer',
    statutoryTitle: 'Presiding Officer Workspace Role',
    description: 'Records session and vote details supported by the organization’s legislative records.',
  },
  LCE_OFFICE: {
    label: 'Local Chief Executive Office',
    statutoryTitle: 'LCE Office Workspace Role (RA 7160 § 54)',
    description: 'Records approval or veto information supported by an independently retained executive record.',
  },
};

export const STAGE_TRANSITION_ROLES: Record<LegislativeStage, SanggunianRole[]> = {
  DRAFTING: ['LEGISLATIVE_STAFF', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  FIRST_READING: ['SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  COMMITTEE_REVIEW: ['SANGGUNIAN_SECRETARY', 'COMMITTEE_CHAIR', 'LGU_ADMIN'],
  SECOND_READING: ['COMMITTEE_CHAIR', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  THIRD_READING: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  TRANSMITTED_TO_LCE: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  AWAITING_PUNONG_BARANGAY_SIGNATURE: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  ADOPTED: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  ENACTED: ['LCE_OFFICE', 'PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  VETOED: ['LCE_OFFICE', 'LGU_ADMIN'],
  LAPSED_INTO_LAW: ['SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
};

export interface StageValidationResult {
  isValid: boolean;
  error?: string;
}

function parseDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  );
}

function recordsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function getNextStages(
  currentStage: LegislativeStage,
  jurisdiction: JurisdictionLevel,
  documentType: string,
): LegislativeStage[] {
  const common: Partial<Record<LegislativeStage, LegislativeStage[]>> = {
    DRAFTING: ['FIRST_READING'],
    FIRST_READING: ['COMMITTEE_REVIEW'],
    COMMITTEE_REVIEW: ['SECOND_READING'],
    SECOND_READING: ['THIRD_READING'],
    ADOPTED: [],
    ENACTED: [],
    LAPSED_INTO_LAW: [],
  };
  if (currentStage in common) return common[currentStage] ?? [];
  if (currentStage === 'THIRD_READING') {
    if (documentType.toUpperCase() === 'RESOLUTION') return ['ADOPTED'];
    return jurisdiction === 'barangay' ? ['AWAITING_PUNONG_BARANGAY_SIGNATURE'] : ['TRANSMITTED_TO_LCE'];
  }
  if (currentStage === 'AWAITING_PUNONG_BARANGAY_SIGNATURE') return ['ENACTED'];
  if (currentStage === 'TRANSMITTED_TO_LCE') return ['ENACTED', 'VETOED'];
  if (currentStage === 'VETOED') return ['ENACTED'];
  return [];
}

function validateChronology(milestones: LegislativeMilestones): StageValidationResult {
  const orderedDates: Array<[string, string | undefined]> = [
    ['first reading', milestones.firstReadingDate],
    ['committee hearing', milestones.committeeHearingDate],
    ['second reading', milestones.secondReadingDate],
    ['period of amendments', milestones.periodOfAmendmentsDate],
    ['third reading', milestones.thirdReadingDate],
    ['transmittal', milestones.transmittedDate],
  ];
  let previous: [string, Date] | null = null;
  for (const [label, value] of orderedDates) {
    if (!value) continue;
    const parsed = parseDate(value);
    if (!parsed) return { isValid: false, error: `The ${label} date is not a valid calendar date.` };
    if (previous && parsed < previous[1]) {
      return { isValid: false, error: `The ${label} date cannot precede the ${previous[0]} date.` };
    }
    previous = [label, parsed];
  }

  for (const [label, value] of [
    ['executive action', milestones.lceActionDate],
    ['veto override', milestones.vetoOverrideDate],
    ['Punong Barangay signature', milestones.punongBarangaySignatureDate],
  ] as Array<[string, string | undefined]>) {
    if (!value) continue;
    const parsed = parseDate(value);
    if (!parsed) return { isValid: false, error: `The ${label} date is not a valid calendar date.` };
    const baseline = parseDate(milestones.transmittedDate) ?? parseDate(milestones.thirdReadingDate);
    if (baseline && parsed < baseline) {
      return { isValid: false, error: `The ${label} date cannot precede the preceding legislative action.` };
    }
  }

  if (milestones.lceAction === 'VETOED' && milestones.vetoOverrideDate && milestones.lceActionDate) {
    const veto = parseDate(milestones.lceActionDate);
    const override = parseDate(milestones.vetoOverrideDate);
    if (veto && override && override < veto) {
      return { isValid: false, error: 'The veto override date cannot precede the veto date.' };
    }
  }
  return { isValid: true };
}

function validateVotingEvidence(
  voting: VotingRecord | undefined,
  jurisdiction: JurisdictionLevel,
  requireTwoThirds = false,
  requireBarangayMajorityOfAll = true,
): StageValidationResult {
  if (!voting) return { isValid: false, error: 'A recorded nominal voting record is required.' };
  const totalMembership = voting.totalMembership ?? 0;
  const membersPresent = voting.membersPresent ?? 0;
  const votesRecorded = voting.ayes + voting.nays + voting.abstentions;
  if (totalMembership <= 0 || membersPresent <= 0 || membersPresent > totalMembership) {
    return { isValid: false, error: 'Total membership and members present must be recorded consistently.' };
  }
  const quorum = Math.floor(totalMembership / 2) + 1;
  if (membersPresent < quorum) {
    return { isValid: false, error: 'The recorded attendance does not establish a majority quorum.' };
  }
  if (!voting.rollCallRecorded) {
    return { isValid: false, error: 'Confirm that the nominal roll-call vote is supported by the legislative record.' };
  }
  if (votesRecorded > membersPresent) {
    return { isValid: false, error: 'Recorded votes cannot exceed the number of members present.' };
  }
  if (requireTwoThirds) {
    if (voting.ayes < Math.ceil((2 * totalMembership) / 3)) {
      return { isValid: false, error: 'A veto override requires affirmative votes of two-thirds of all members.' };
    }
  } else {
    const requiresMajorityOfAll = jurisdiction === 'barangay' && requireBarangayMajorityOfAll;
    const requiredAyes = requiresMajorityOfAll ? quorum : Math.floor(membersPresent / 2) + 1;
    if (voting.ayes < requiredAyes) {
      return {
        isValid: false,
        error: requiresMajorityOfAll
          ? 'A barangay ordinance requires recorded approval by a majority of all Sanggunian members.'
          : 'The recorded affirmative votes do not constitute a majority of members present.',
      };
    }
  }
  return { isValid: true };
}

export function validateStageTransition(
  currentMilestones: LegislativeMilestones,
  targetStage: LegislativeStage,
  actorRole: SanggunianRole,
  jurisdiction: JurisdictionLevel = 'city',
  proposedMilestones: LegislativeMilestones = currentMilestones,
  documentType = 'ORDINANCE',
): StageValidationResult {
  const allowedRoles = STAGE_TRANSITION_ROLES[targetStage];
  if (!allowedRoles || !LEGISLATIVE_STAGES.some((item) => item.stage === currentMilestones.currentStage)) {
    return { isValid: false, error: 'Unknown legislative stage.' };
  }

  const chronology = validateChronology(proposedMilestones);
  if (!chronology.isValid) return chronology;

  const changesStage = targetStage !== currentMilestones.currentStage;
  if (changesStage && !['ORDINANCE', 'RESOLUTION'].includes(documentType.toUpperCase())) {
    return {
      isValid: false,
      error: 'This legislative milestone workflow is only available for ordinances and resolutions.',
    };
  }
  if (
    changesStage &&
    !getNextStages(currentMilestones.currentStage, jurisdiction, documentType).includes(targetStage)
  ) {
    return { isValid: false, error: 'Legislative stages cannot be skipped or rolled back through draft editing.' };
  }

  const workflowChanged = !recordsEqual(proposedMilestones, currentMilestones);
  const workflowEditRoles: Partial<Record<LegislativeStage, SanggunianRole[]>> = {
    DRAFTING: ['LEGISLATIVE_STAFF', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
    FIRST_READING: ['SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
    COMMITTEE_REVIEW: ['COMMITTEE_CHAIR', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
    SECOND_READING: ['COMMITTEE_CHAIR', 'PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
    THIRD_READING: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
    TRANSMITTED_TO_LCE: ['LCE_OFFICE', 'LGU_ADMIN'],
    AWAITING_PUNONG_BARANGAY_SIGNATURE: ['PRESIDING_OFFICER', 'LCE_OFFICE', 'LGU_ADMIN'],
    VETOED: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
    ADOPTED: ['LGU_ADMIN'],
    ENACTED: ['LGU_ADMIN'],
    LAPSED_INTO_LAW: ['LGU_ADMIN'],
  };
  if (workflowChanged && !(workflowEditRoles[currentMilestones.currentStage] ?? []).includes(actorRole)) {
    return { isValid: false, error: 'Your workspace role cannot alter records at the current legislative stage.' };
  }

  const changesLceAction =
    proposedMilestones.lceAction !== currentMilestones.lceAction ||
    proposedMilestones.lceActionDate !== currentMilestones.lceActionDate ||
    proposedMilestones.vetoMessageReference !== currentMilestones.vetoMessageReference;
  if (changesLceAction && !['LCE_OFFICE', 'LGU_ADMIN'].includes(actorRole)) {
    return { isValid: false, error: 'Only the LCE office or an LGU administrator can record executive action.' };
  }
  if (changesLceAction && !changesStage) {
    return {
      isValid: false,
      error: 'Record executive approval or veto together with the matching ENACTED or VETOED stage transition.',
    };
  }
  if (changesLceAction && currentMilestones.currentStage !== 'TRANSMITTED_TO_LCE') {
    return { isValid: false, error: 'Executive action can only follow a recorded transmittal to the LCE.' };
  }

  const changesEnactmentEvidence =
    proposedMilestones.enactmentBasis !== currentMilestones.enactmentBasis ||
    proposedMilestones.punongBarangaySignatureDate !== currentMilestones.punongBarangaySignatureDate ||
    proposedMilestones.vetoOverrideDate !== currentMilestones.vetoOverrideDate;
  if (changesEnactmentEvidence && !changesStage) {
    return { isValid: false, error: 'Record enactment evidence together with the matching stage transition.' };
  }
  const changesVotingRecord =
    !recordsEqual(proposedMilestones.votingRecord, currentMilestones.votingRecord) ||
    !recordsEqual(proposedMilestones.vetoOverrideVotingRecord, currentMilestones.vetoOverrideVotingRecord);
  if (changesVotingRecord && !['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'].includes(actorRole)) {
    return { isValid: false, error: 'Only the presiding officer, secretary, or LGU administrator can record votes.' };
  }
  if (!changesStage) return { isValid: true };

  if (!allowedRoles.includes(actorRole)) {
    const roleMeta = SANGGUNIAN_ROLE_LABELS[actorRole];
    return {
      isValid: false,
      error: `Access denied: Your role (${roleMeta?.label ?? actorRole}) cannot transition this draft to '${targetStage}'.`,
    };
  }

  if (targetStage !== 'ENACTED') {
    if (proposedMilestones.enactmentBasis || proposedMilestones.punongBarangaySignatureDate) {
      return { isValid: false, error: 'Enactment basis and signature evidence may only accompany ENACTED.' };
    }
    if (proposedMilestones.vetoOverrideDate || proposedMilestones.vetoOverrideVotingRecord) {
      return { isValid: false, error: 'Veto-override evidence may only accompany an ENACTED override transition.' };
    }
  }

  if (targetStage === 'FIRST_READING' && !proposedMilestones.firstReadingDate) {
    return { isValid: false, error: 'Record the first-reading date before advancing the workflow.' };
  }
  if (targetStage === 'COMMITTEE_REVIEW' && !proposedMilestones.referredCommittee?.trim()) {
    return { isValid: false, error: 'Record the committee referral shown by the first-reading record.' };
  }
  if (targetStage === 'SECOND_READING') {
    if (!proposedMilestones.committeeReportNo?.trim()) {
      return { isValid: false, error: 'Record the applicable committee report reference before second reading.' };
    }
    if (!proposedMilestones.secondReadingDate) {
      return { isValid: false, error: 'Record the second-reading date before advancing the workflow.' };
    }
  }
  if (targetStage === 'THIRD_READING' && !proposedMilestones.thirdReadingDate) {
    return { isValid: false, error: 'Record the third-reading date before advancing the workflow.' };
  }

  if (['TRANSMITTED_TO_LCE', 'AWAITING_PUNONG_BARANGAY_SIGNATURE', 'ADOPTED'].includes(targetStage)) {
    if (!proposedMilestones.thirdReadingDate) {
      return { isValid: false, error: 'Record the third-reading date before recording the post-vote milestone.' };
    }
    const voting = validateVotingEvidence(
      proposedMilestones.votingRecord,
      jurisdiction,
      false,
      documentType.toUpperCase() === 'ORDINANCE',
    );
    if (!voting.isValid) return voting;
  }

  if (targetStage === 'TRANSMITTED_TO_LCE') {
    if (jurisdiction === 'barangay' || documentType.toUpperCase() !== 'ORDINANCE') {
      return { isValid: false, error: 'This measure does not use the mayor/governor transmittal stage.' };
    }
    if (!proposedMilestones.transmittedDate) {
      return { isValid: false, error: 'Record the ordinance transmittal date before advancing the workflow.' };
    }
    const expectedDeadline = calculateTransmittalDeadline(proposedMilestones.transmittedDate, jurisdiction);
    if (proposedMilestones.transmittalDeadline !== expectedDeadline) {
      return {
        isValid: false,
        error: 'The indicative Section 54 deadline does not match the recorded transmittal date.',
      };
    }
  }

  if (targetStage === 'AWAITING_PUNONG_BARANGAY_SIGNATURE' && jurisdiction !== 'barangay') {
    return { isValid: false, error: 'The Punong Barangay signature stage is only applicable to barangay ordinances.' };
  }

  if (targetStage === 'ADOPTED' && documentType.toUpperCase() !== 'RESOLUTION') {
    return { isValid: false, error: 'The adoption stage is reserved for resolutions.' };
  }

  if (targetStage === 'VETOED') {
    if (proposedMilestones.lceAction !== 'VETOED' || !proposedMilestones.lceActionDate) {
      return { isValid: false, error: 'Record the veto and its date together with the VETOED transition.' };
    }
    if (!proposedMilestones.vetoMessageReference?.trim()) {
      return { isValid: false, error: 'Record a reference to the written veto objections.' };
    }
  }

  if (targetStage === 'ENACTED') {
    if (currentMilestones.currentStage === 'AWAITING_PUNONG_BARANGAY_SIGNATURE') {
      if (!['PRESIDING_OFFICER', 'LCE_OFFICE', 'LGU_ADMIN'].includes(actorRole)) {
        return { isValid: false, error: 'Only the Punong Barangay office role can record the signature step.' };
      }
      if (jurisdiction !== 'barangay' || !proposedMilestones.punongBarangaySignatureDate) {
        return { isValid: false, error: 'Record the Punong Barangay signature date before enactment.' };
      }
      if (proposedMilestones.enactmentBasis !== 'BARANGAY_MAJORITY_AND_SIGNATURE') {
        return { isValid: false, error: 'Record the barangay majority-and-signature enactment basis.' };
      }
    } else if (currentMilestones.currentStage === 'VETOED') {
      if (!['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'].includes(actorRole)) {
        return { isValid: false, error: 'Only an authorized Sanggunian role can record a veto override.' };
      }
      if (!proposedMilestones.vetoOverrideDate) {
        return { isValid: false, error: 'Record the veto-override date before advancing.' };
      }
      const overrideVote = validateVotingEvidence(proposedMilestones.vetoOverrideVotingRecord, jurisdiction, true);
      if (!overrideVote.isValid) return overrideVote;
      if (proposedMilestones.enactmentBasis !== 'VETO_OVERRIDE') {
        return { isValid: false, error: 'Record veto override as the enactment basis.' };
      }
    } else {
      if (!['LCE_OFFICE', 'LGU_ADMIN'].includes(actorRole)) {
        return { isValid: false, error: 'Only the LCE office role can record executive approval.' };
      }
      if (proposedMilestones.lceAction !== 'APPROVED' || !proposedMilestones.lceActionDate) {
        return { isValid: false, error: 'Record LCE approval and its date together with the ENACTED transition.' };
      }
      if (proposedMilestones.enactmentBasis !== 'LCE_APPROVAL') {
        return { isValid: false, error: 'Record LCE approval as the enactment basis.' };
      }
    }
  }

  if (targetStage === 'LAPSED_INTO_LAW' || proposedMilestones.enactmentBasis === 'DEEMED_APPROVED') {
    return {
      isValid: false,
      error:
        'Deemed approval requires a separately verified deadline and legal review and is unavailable in draft editing.',
    };
  }

  return { isValid: true };
}
