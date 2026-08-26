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
