import type { JurisdictionLevel } from './schemas/enums';

export interface StatutoryCitation {
  id: string;
  source: 'RA 7160' | '1987 Constitution' | 'DILG Memorandum' | 'Supreme Court Jurisprudence' | 'National Law';
  provision: string;
  title: string;
  relevance: string;
  sampleWhereas: string;
}

export const PHILIPPINE_STATUTORY_DATABASE: StatutoryCitation[] = [
  {
    id: 'ra7160-sec16',
    source: 'RA 7160',
    provision: 'Section 16',
    title: 'General Welfare Clause',
    relevance: 'The foundational police power mandate authorizing LGUs to enact ordinances promoting health, safety, morals, peace, and general welfare.',
    sampleWhereas:
      'WHEREAS, Section 16 of Republic Act No. 7160, otherwise known as the Local Government Code of 1991, mandates that local government units shall exercise the powers expressly granted, as well as powers necessary, appropriate, or incidental for efficient and effective governance, and those which are essential to the promotion of the general welfare;',
  },
  {
    id: 'const-art10-sec5',
    source: '1987 Constitution',
    provision: 'Article X, Section 5',
    title: 'Local Taxation & Revenue Power',
    relevance: 'Constitutional authority granting each LGU the power to create its own sources of revenues and levy taxes, fees, and charges.',
    sampleWhereas:
      'WHEREAS, Section 5, Article X of the 1987 Philippine Constitution empowers local government units to create their own sources of revenues and to levy taxes, fees, and charges subject to such guidelines and limitations as the Congress may provide;',
  },
  {
    id: 'ra7160-sec187',
    source: 'RA 7160',
    provision: 'Section 187',
    title: 'Procedure for Enactment of Tax Ordinances & Public Hearings',
    relevance: 'Mandatory requirement that tax or revenue measures must be preceded by public hearings conducted prior to enactment.',
    sampleWhereas:
      'WHEREAS, pursuant to Section 187 of RA 7160, requisite public hearings and consultations were duly conducted to ensure transparency and civic participation in setting regulatory fees and tax schedules;',
  },
  {
    id: 'ra7160-sec54',
    source: 'RA 7160',
    provision: 'Section 54',
    title: 'Approval and Veto of Ordinances by Local Chief Executives',
    relevance: 'Governs the transmittal, 10-day/15-day review timeline, signature, and item-veto powers of Mayors and Governors.',
    sampleWhereas:
      'WHEREAS, this legislative measure is enacted in full compliance with the approval and veto mechanisms established under Section 54 of the Local Government Code;',
  },
  {
    id: 'ra7160-sec391-468',
    source: 'RA 7160',
    provision: 'Sections 391, 447, 458, 468',
    title: 'Statutory Penal Ceilings by LGU Level',
    relevance: 'Prescribes maximum fines (Barangay ₱1k, Municipal ₱2.5k, City/Provincial ₱5k) and imprisonment terms.',
    sampleWhereas:
      'WHEREAS, the penal provisions herein provided are calibrated in strict conformity with the statutory limits prescribed under Republic Act No. 7160;',
  },
  {
    id: 'dilg-mc-curfew',
    source: 'DILG Memorandum',
    provision: 'DILG MC No. 2019-145 & PD 603',
    title: 'Child and Youth Welfare & Curfew Guidelines',
    relevance: 'Protects minors while respecting constitutional rights to liberty and travel pursuant to Supreme Court SPARK v. Quezon City.',
    sampleWhereas:
      'WHEREAS, DILG Memorandum Circulars together with Presidential Decree No. 603 (Child and Youth Welfare Code) enjoin LGUs to establish protective youth measures with due process safeguards;',
  },
  {
    id: 'ra9003-solidwaste',
    source: 'National Law',
    provision: 'RA 9003, Section 10',
    title: 'Ecological Solid Waste Management Act',
    relevance: 'Mandates segregation of waste at source and assigns collection of biodegradable/recyclable waste to Barangays and non-recyclable to Cities/Municipalities.',
    sampleWhereas:
      'WHEREAS, Section 10 of Republic Act No. 9003 (Ecological Solid Waste Management Act of 2000) designates local government units as the primary duty-bearers in the implementation of waste segregation and resource recovery;',
  },
  {
    id: 'sc-manila-laguio',
    source: 'Supreme Court Jurisprudence',
    provision: 'G.R. No. 118127 (City of Manila v. Judge Laguio)',
    title: 'Due Process & Reasonableness in LGU Police Power',
    relevance: 'Landmark Supreme Court decision ruling that local ordinances must not be unreasonable, discriminatory, or oppressive, and must provide administrative due process.',
    sampleWhereas:
      'WHEREAS, the Supreme Court has consistently held that to be valid, an ordinance must not only conform with national statutes but must also observe substantive due process and administrative fairness;',
  },
];

export function getStatutoryCitations(topicOrContent: string, jurisdiction: JurisdictionLevel): StatutoryCitation[] {
  const normalized = topicOrContent.toLowerCase();
  const matched: StatutoryCitation[] = [];

  // General Welfare is universally applicable
  matched.push(PHILIPPINE_STATUTORY_DATABASE[0]);

  if (/tax|fee|revenue|charge|levy|assessment/i.test(normalized)) {
    matched.push(PHILIPPINE_STATUTORY_DATABASE[1]);
    matched.push(PHILIPPINE_STATUTORY_DATABASE[2]);
  }

  if (/penalty|penal|fine|imprison|jail/i.test(normalized)) {
    matched.push(PHILIPPINE_STATUTORY_DATABASE[4]);
  }

  if (/curfew|minor|child|youth|night/i.test(normalized)) {
    matched.push(PHILIPPINE_STATUTORY_DATABASE[5]);
  }

  if (/waste|garbage|sanitation|environment|litter/i.test(normalized)) {
    matched.push(PHILIPPINE_STATUTORY_DATABASE[6]);
  }

  if (/closure|revocation|permit|license|confiscat/i.test(normalized)) {
    matched.push(PHILIPPINE_STATUTORY_DATABASE[7]);
  }

  return matched;
}

export function generateSuggestedWhereasClauses(
  content: string,
  jurisdictionName: string,
  jurisdiction: JurisdictionLevel,
): string[] {
  const citations = getStatutoryCitations(content, jurisdiction);
  const clauses = citations.map((c) => c.sampleWhereas);

  clauses.push(
    `WHEREAS, after careful deliberation, the Sanggunian finds it necessary and beneficial to enact this measure for the peace, safety, and welfare of the constituents of ${jurisdictionName || 'the local government unit'};`,
  );

  return clauses;
}
