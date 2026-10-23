import type { JurisdictionLevel } from './schemas/enums';

export interface StatutoryCitation {
  id: string;
  source: 'RA 7160' | '1987 Constitution' | 'Supreme Court Jurisprudence' | 'National Law';
  provision: string;
  title: string;
  relevance: string;
  sampleWhereas: string;
  jurisdictions?: JurisdictionLevel[];
  sourceUrl: string;
}

export const PHILIPPINE_STATUTORY_DATABASE: StatutoryCitation[] = [
  {
    id: 'ra7160-sec16',
    source: 'RA 7160',
    provision: 'Section 16',
    title: 'General Welfare Clause',
    relevance:
      'The foundational police power mandate authorizing LGUs to enact ordinances promoting health, safety, morals, peace, and general welfare.',
    sampleWhereas:
      'WHEREAS, Section 16 of Republic Act No. 7160, otherwise known as the Local Government Code of 1991, provides for powers necessary, appropriate, or incidental for efficient and effective local governance and those essential to the promotion of the general welfare;',
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html',
  },
  {
    id: 'const-art10-sec5',
    source: '1987 Constitution',
    provision: 'Article X, Section 5',
    title: 'Local Taxation & Revenue Power',
    relevance:
      'Constitutional authority granting each LGU the power to create its own sources of revenues and levy taxes, fees, and charges.',
    sampleWhereas:
      'WHEREAS, Section 5, Article X of the 1987 Philippine Constitution authorizes local government units to create their own sources of revenues and levy taxes, fees, and charges, subject to congressional guidelines and limitations;',
    sourceUrl: 'https://lawphil.net/consti/cons1987.html',
  },
  {
    id: 'ra7160-sec187',
    source: 'RA 7160',
    provision: 'Section 187',
    title: 'Procedure for Enactment of Tax Ordinances & Public Hearings',
    relevance:
      'Mandatory requirement that tax or revenue measures must be preceded by public hearings conducted prior to enactment.',
    sampleWhereas:
      'WHEREAS, Section 187 of Republic Act No. 7160 requires public hearings before the enactment of local tax ordinances and revenue measures;',
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html',
  },
  {
    id: 'ra7160-sec54',
    source: 'RA 7160',
    provision: 'Section 54',
    title: 'Approval and Veto of Ordinances by Local Chief Executives',
    relevance:
      'Governs the transmittal, 10-day/15-day review timeline, signature, and item-veto powers of Mayors and Governors.',
    sampleWhereas:
      'WHEREAS, Section 54 of Republic Act No. 7160 prescribes the approval and veto process for provincial, city, and municipal ordinances;',
    jurisdictions: ['provincial', 'city', 'municipal'],
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html',
  },
  {
    id: 'ra7160-sec391-468',
    source: 'RA 7160',
    provision: 'Sections 391, 447, 458, 468',
    title: 'Statutory Penal Ceilings by LGU Level',
    relevance: 'Prescribes maximum fines (Barangay ₱1k, Municipal ₱2.5k, City/Provincial ₱5k) and imprisonment terms.',
    sampleWhereas:
      'WHEREAS, any proposed penal provision must remain within the applicable statutory limits under Republic Act No. 7160 and requires legal review before enactment;',
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html',
  },
  {
    id: 'sc-spark-curfew',
    source: 'Supreme Court Jurisprudence',
    provision: 'G.R. No. 225442 (SPARK v. Quezon City, August 8, 2017)',
    title: 'Constitutional limits on curfews affecting minors',
    relevance:
      'The Supreme Court upheld the narrowly tailored Quezon City measure but invalidated the challenged Manila and Navotas provisions; any proposed curfew requires fact-specific rights and exemptions review.',
    sampleWhereas:
      'WHEREAS, any proposed restriction affecting minors must be narrowly tailored, include appropriate exemptions, and respect constitutional rights and applicable juvenile-justice protections;',
    sourceUrl: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/1/63300',
  },
  {
    id: 'ra9003-solidwaste',
    source: 'National Law',
    provision: 'RA 9003, Section 10',
    title: 'Ecological Solid Waste Management Act',
    relevance:
      'Mandates segregation of waste at source and assigns collection of biodegradable/recyclable waste to Barangays and non-recyclable to Cities/Municipalities.',
    sampleWhereas:
      'WHEREAS, Section 10 of Republic Act No. 9003 allocates solid-waste responsibilities among local government units, including barangay-level segregation and collection of biodegradable, compostable, and reusable wastes;',
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra2001/ra_9003_2001.html',
  },
  {
    id: 'sc-manila-laguio',
    source: 'Supreme Court Jurisprudence',
    provision: 'G.R. No. 118127 (City of Manila v. Judge Laguio)',
    title: 'Due Process & Reasonableness in LGU Police Power',
    relevance:
      'Landmark Supreme Court decision ruling that local ordinances must not be unreasonable, discriminatory, or oppressive, and must provide administrative due process.',
    sampleWhereas:
      'WHEREAS, local regulation must remain within delegated authority and satisfy constitutional requirements of reasonableness and due process;',
    sourceUrl: 'https://lawphil.net/judjuris/juri2005/apr2005/gr_118127_2005.html',
  },
  {
    id: 'ra7160-katarungan',
    source: 'RA 7160',
    provision: 'Sections 399–422 (Chapter 7)',
    title: 'Katarungang Pambarangay System',
    relevance:
      'Mandates amicable settlement of barangay disputes at the Lupon Tagapamayapa level as a condition precedent before court filing.',
    sampleWhereas:
      'WHEREAS, Chapter 7 of Republic Act No. 7160 establishes the Katarungang Pambarangay framework for covered disputes, subject to its statutory scope and exceptions;',
    jurisdictions: ['barangay'],
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html',
  },
  {
    id: 'ra10121-drrm',
    source: 'National Law',
    provision: 'RA 10121, Sections 12 and 21',
    title: 'Philippine Disaster Risk Reduction and Management Act',
    relevance:
      'Section 12 establishes local DRRM offices; Section 21 requires an LDRRM Fund of not less than 5% of estimated revenue from regular sources.',
    sampleWhereas:
      'WHEREAS, Sections 12 and 21 of Republic Act No. 10121 establish local disaster-risk-management institutions and prescribe the Local Disaster Risk Reduction and Management Fund;',
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra2010/ra_10121_2010.html',
  },
  {
    id: 'ra11032-eodb',
    source: 'National Law',
    provision: 'RA 11032, Sections 7, 9, and 11',
    title: 'Ease of Doing Business and Efficient Government Service Delivery Act',
    relevance:
      'Sections 7 and 9 address zero-contact and processing requirements; Section 11 prescribes streamlined local business permitting and BOSS/e-BOSS measures for cities and municipalities.',
    sampleWhereas:
      'WHEREAS, Republic Act No. 11032 prescribes service-delivery safeguards and streamlined local business-permitting procedures within its applicable scope;',
    jurisdictions: ['city', 'municipal'],
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra2018/ra_11032_2018.html',
  },
];

const CITATION_MAP = new Map(PHILIPPINE_STATUTORY_DATABASE.map((c) => [c.id, c]));

export function getStatutoryCitations(topicOrContent: string, jurisdiction: JurisdictionLevel): StatutoryCitation[] {
  const normalized = topicOrContent.toLowerCase();
  const matched: StatutoryCitation[] = [];

  const addCitation = (id: string) => {
    const citation = CITATION_MAP.get(id);
    if (
      citation &&
      (!citation.jurisdictions || citation.jurisdictions.includes(jurisdiction)) &&
      !matched.some((c) => c.id === id)
    ) {
      matched.push(citation);
    }
  };

  // General Welfare is universally applicable
  addCitation('ra7160-sec16');

  if (/tax|fee|revenue|charge|levy|assessment/i.test(normalized)) {
    addCitation('const-art10-sec5');
    addCitation('ra7160-sec187');
  }

  if (/penalty|penal|fine|imprison|jail/i.test(normalized)) {
    addCitation('ra7160-sec391-468');
  }

  if (/curfew|minor|child|youth|night/i.test(normalized)) {
    addCitation('sc-spark-curfew');
  }

  if (/waste|garbage|sanitation|environment|litter/i.test(normalized)) {
    addCitation('ra9003-solidwaste');
  }

  if (/closure|revocation|permit|license|confiscat/i.test(normalized)) {
    addCitation('sc-manila-laguio');
  }

  if (/dispute|lupon|barangay justice|amicable settlement|katarungan|mediation|arbitrat/i.test(normalized)) {
    addCitation('ra7160-katarungan');
  }

  if (/disaster|calamity|evacuation|climate|flood|earthquake|emergency|drrm|ldrm/i.test(normalized)) {
    addCitation('ra10121-drrm');
  }

  if (/business permit|ease of doing business|streamline|one-stop|e-boss|red tape|anti-red tape/i.test(normalized)) {
    addCitation('ra11032-eodb');
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
    `WHEREAS, the proposed measure concerns the peace, safety, and welfare of the constituents of ${jurisdictionName || 'the local government unit'} and remains subject to factual validation, public deliberation, and authorized legal review;`,
  );

  return clauses;
}
