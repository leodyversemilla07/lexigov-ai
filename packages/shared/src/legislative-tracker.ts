import type { JurisdictionLevel } from './schemas/enums';

export type LegislativeStage =
  | 'DRAFTING'
  | 'FIRST_READING'
  | 'COMMITTEE_REVIEW'
  | 'SECOND_READING'
  | 'THIRD_READING'
  | 'TRANSMITTED_TO_LCE'
  | 'ENACTED'
  | 'VETOED'
  | 'LAPSED_INTO_LAW';

export interface VotingRecord {
  ayes: number;
  nays: number;
  abstentions: number;
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
  enactmentNo?: string;
  [key: string]: unknown;
}

export const LEGISLATIVE_STAGES: Array<{
  stage: LegislativeStage;
  label: string;
  description: string;
  stepNumber: number;
}> = [
  {
    stage: 'DRAFTING',
    label: 'Preparation & Drafting',
    description: 'Initial legislative drafting and legal review before formal filing.',
    stepNumber: 1,
  },
  {
    stage: 'FIRST_READING',
    label: 'First Reading',
    description: 'Reading of title and formal referral to the appropriate Standing Committee.',
    stepNumber: 2,
  },
  {
    stage: 'COMMITTEE_REVIEW',
    label: 'Committee Review & Hearing',
    description: 'Public hearings, stakeholder consultations, and committee report preparation.',
    stepNumber: 3,
  },
  {
    stage: 'SECOND_READING',
    label: 'Second Reading',
    description: 'Sponsorship speech, plenary debate, interpellation, and floor amendments.',
    stepNumber: 4,
  },
  {
    stage: 'THIRD_READING',
    label: 'Third & Final Reading',
    description: 'Nominal roll-call voting on the engrossed final copy.',
    stepNumber: 5,
  },
  {
    stage: 'TRANSMITTED_TO_LCE',
    label: 'Transmitted to Mayor/Governor',
    description: 'Submitted to the Local Chief Executive for signature, veto, or lapse into law.',
    stepNumber: 6,
  },
  {
    stage: 'ENACTED',
    label: 'Enacted into Law',
    description: 'Duly approved and signed by the Mayor/Governor pursuant to RA 7160 Section 54.',
    stepNumber: 7,
  },
];

export function calculateTransmittalDeadline(transmittedDateStr: string, jurisdiction: JurisdictionLevel): string {
  const date = new Date(transmittedDateStr);
  if (Number.isNaN(date.getTime())) return '';

  // Under RA 7160 Section 54:
  // Province / Highly Urbanized City: 15 days
  // Component City / Municipality: 10 days
  const daysLimit = jurisdiction === 'provincial' ? 15 : 10;
  date.setDate(date.getDate() + daysLimit);
  return date.toISOString().split('T')[0] ?? '';
}

export function getDefaultMilestones(): LegislativeMilestones {
  return {
    currentStage: 'DRAFTING',
    votingRecord: { ayes: 0, nays: 0, abstentions: 0 },
    lceAction: 'PENDING',
  };
}

export const SANGGUNIAN_ROLE_LABELS: Record<
  import('./schemas/enums').SanggunianRole,
  { label: string; statutoryTitle: string; description: string }
> = {
  LGU_ADMIN: {
    label: 'LGU Administrator',
    statutoryTitle: 'Workspace & System Administrator',
    description: 'Full administrative authority across all organization drafts and member assignments.',
  },
  LEGISLATIVE_STAFF: {
    label: 'Legislative Staff / Researcher',
    statutoryTitle: 'Sanggunian Legislative Researcher',
    description: 'Responsible for ordinance drafting, AI prompt orchestration, and initial legal research.',
  },
  COMMITTEE_CHAIR: {
    label: 'Committee Chairperson',
    statutoryTitle: 'Standing Committee Chairperson',
    description: 'Directs committee hearings, drafts Committee Reports, and endorses committee amendments.',
  },
  SANGGUNIAN_SECRETARY: {
    label: 'Secretary to the Sanggunian',
    statutoryTitle: 'Sanggunian Secretary (RA 7160 § 469)',
    description: 'Calendars 1st reading, keeps official journals, numbers enactments, and tracks LCE transmittals.',
  },
  PRESIDING_OFFICER: {
    label: 'Presiding Officer (Vice Mayor / Vice Gov)',
    statutoryTitle: 'Presiding Officer (RA 7160 § 445 / 455)',
    description:
      'Presides over plenary sessions, maintains session order, and certifies 3rd reading nominal roll-call votes.',
  },
  LCE_OFFICE: {
    label: 'Local Chief Executive (Mayor / Governor)',
    statutoryTitle: 'Mayor / Provincial Governor (RA 7160 § 54)',
    description: 'Executes statutory approval, issues formal veto messages, or logs lapsed enactments.',
  },
};

export const STAGE_TRANSITION_ROLES: Record<LegislativeStage, Array<import('./schemas/enums').SanggunianRole>> = {
  DRAFTING: ['LEGISLATIVE_STAFF', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  FIRST_READING: ['LEGISLATIVE_STAFF', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  COMMITTEE_REVIEW: ['SANGGUNIAN_SECRETARY', 'COMMITTEE_CHAIR', 'LGU_ADMIN'],
  SECOND_READING: ['COMMITTEE_CHAIR', 'LGU_ADMIN'],
  THIRD_READING: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  TRANSMITTED_TO_LCE: ['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  ENACTED: ['LCE_OFFICE', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
  VETOED: ['LCE_OFFICE', 'LGU_ADMIN'],
  LAPSED_INTO_LAW: ['SANGGUNIAN_SECRETARY', 'LGU_ADMIN'],
};

const NEXT_STAGES: Record<LegislativeStage, LegislativeStage[]> = {
  DRAFTING: ['FIRST_READING'],
  FIRST_READING: ['COMMITTEE_REVIEW'],
  COMMITTEE_REVIEW: ['SECOND_READING'],
  SECOND_READING: ['THIRD_READING'],
  THIRD_READING: ['TRANSMITTED_TO_LCE'],
  TRANSMITTED_TO_LCE: ['ENACTED', 'VETOED', 'LAPSED_INTO_LAW'],
  ENACTED: [],
  VETOED: ['DRAFTING'],
  LAPSED_INTO_LAW: [],
};

export interface StageValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateStageTransition(
  currentMilestones: LegislativeMilestones,
  targetStage: LegislativeStage,
  actorRole: import('./schemas/enums').SanggunianRole,
  _jurisdiction: JurisdictionLevel = 'city',
  proposedMilestones: LegislativeMilestones = currentMilestones,
): StageValidationResult {
  const allowedRoles = STAGE_TRANSITION_ROLES[targetStage];
  if (!allowedRoles || !NEXT_STAGES[currentMilestones.currentStage]) {
    return { isValid: false, error: 'Unknown legislative stage.' };
  }
  const changesStage = targetStage !== currentMilestones.currentStage;
  if (changesStage && !NEXT_STAGES[currentMilestones.currentStage].includes(targetStage)) {
    return { isValid: false, error: 'Legislative stages cannot be skipped or rolled back through draft editing.' };
  }

  const changesLceAction =
    proposedMilestones.lceAction !== currentMilestones.lceAction ||
    proposedMilestones.lceActionDate !== currentMilestones.lceActionDate;
  if (changesLceAction && !['LCE_OFFICE', 'LGU_ADMIN'].includes(actorRole)) {
    return { isValid: false, error: 'Only the LCE office or an LGU administrator can record executive action.' };
  }
  if (
    JSON.stringify(proposedMilestones.votingRecord) !== JSON.stringify(currentMilestones.votingRecord) &&
    !['PRESIDING_OFFICER', 'SANGGUNIAN_SECRETARY', 'LGU_ADMIN'].includes(actorRole)
  ) {
    return { isValid: false, error: 'Only the presiding officer, secretary, or LGU administrator can record votes.' };
  }
  if (!changesStage) return { isValid: true };

  if (!allowedRoles.includes(actorRole) && actorRole !== 'LGU_ADMIN') {
    const roleMeta = SANGGUNIAN_ROLE_LABELS[actorRole];
    return {
      isValid: false,
      error: `Access Denied: Your role (${roleMeta?.label ?? actorRole}) is not authorized to transition this draft to '${targetStage}'.`,
    };
  }

  // 2. Statutory Legal Preconditions per Stage
  if (targetStage === 'COMMITTEE_REVIEW' && !proposedMilestones.referredCommittee?.trim()) {
    return {
      isValid: false,
      error: 'Statutory Requirement Missing: Must designate a referred Standing Committee for 1st Reading referral.',
    };
  }

  if (targetStage === 'SECOND_READING' && !proposedMilestones.committeeReportNo?.trim()) {
    return {
      isValid: false,
      error: 'Statutory Requirement Missing: Cannot calendar for 2nd Reading without a Committee Report Number.',
    };
  }

  if (targetStage === 'TRANSMITTED_TO_LCE') {
    const voting = proposedMilestones.votingRecord;
    if (!voting || voting.ayes <= voting.nays) {
      return {
        isValid: false,
        error:
          'Statutory Requirement Missing: Ordinance cannot be transmitted without affirmative nominal roll-call majority (Ayes must exceed Nays).',
      };
    }
  }

  if (targetStage === 'ENACTED' && proposedMilestones.lceAction !== 'APPROVED') {
    return { isValid: false, error: 'Recorded LCE approval is required before marking a measure as enacted.' };
  }
  if (targetStage === 'VETOED' && proposedMilestones.lceAction !== 'VETOED') {
    return { isValid: false, error: 'A recorded executive veto is required.' };
  }
  if (targetStage === 'LAPSED_INTO_LAW') {
    // Lapse depends on legally reviewed dates and jurisdiction rules, not a user-selected label.
    return { isValid: false, error: 'Lapse into law requires a verified review process and is not available in draft editing.' };
  }

  return { isValid: true };
}
