import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const seedUser = {
  id: 'seed_system_user',
  email: 'templates@lexigov.local',
  name: 'LexiGov Template Library',
};

type TemplateSeed = {
  name: string;
  category: string;
  subcategory: string;
  jurisdiction: Array<'barangay' | 'municipal' | 'city' | 'provincial'>;
  documentType: 'ORDINANCE' | 'RESOLUTION' | 'MEMORANDUM' | 'POLICY';
  description: string;
  prompt: string;
  body: string;
};

const templates: TemplateSeed[] = [
  {
    name: 'Barangay Curfew Ordinance',
    category: 'Public Safety',
    subcategory: 'Youth safety',
    jurisdiction: ['barangay'],
    documentType: 'ORDINANCE',
    description: 'Starter ordinance for establishing curfew hours, exceptions, enforcement, and lawful penalties.',
    prompt:
      'Draft a barangay curfew ordinance for minors. Include legal basis, curfew hours, exceptions, enforcement responsibilities, due process, penalties within barangay limits, separability, repealing, and effectivity clauses.',
    body: [
      'SECTION 1. Title.',
      'This Ordinance shall be known as the Barangay Curfew Ordinance.',
      '',
      'SECTION 2. Purpose.',
      'This Ordinance promotes the safety and welfare of minors during late evening hours while recognizing lawful exceptions for emergencies, school, work, religious activities, and travel with a parent or guardian.',
      '',
      'SECTION 3. Curfew Hours.',
      'Minors below eighteen (18) years of age shall not remain in public places during the curfew period unless covered by an exception stated in this Ordinance.',
      '',
      'SECTION 4. Enforcement and Due Process.',
      'Barangay officials shall implement this Ordinance with respect for the rights of minors and their parents or guardians, including proper notice and referral when appropriate.',
      '',
      'SECTION 5. Penalties.',
      'Penalties shall be limited to fines and community-based interventions allowed for barangay ordinances under applicable law.',
      '',
      'SECTION 6. Separability Clause.',
      'If any part of this Ordinance is declared invalid, the remaining provisions shall remain in full force and effect.',
      '',
      'SECTION 7. Repealing Clause.',
      'All inconsistent barangay issuances are repealed or modified accordingly.',
      '',
      'SECTION 8. Effectivity Clause.',
      'This Ordinance shall take effect after posting and compliance with applicable legal requirements.',
    ].join('\n'),
  },
  {
    name: 'Solid Waste Segregation Ordinance',
    category: 'Environment',
    subcategory: 'Waste management',
    jurisdiction: ['barangay', 'municipal', 'city'],
    documentType: 'ORDINANCE',
    description: 'Template for source segregation, collection schedules, prohibited dumping, and enforcement.',
    prompt:
      'Draft a local solid waste segregation ordinance. Include source segregation, collection schedule, prohibited acts, incentives, enforcement office, penalties within jurisdiction limits, publication/posting, separability, repealing, and effectivity clauses.',
    body: [
      'SECTION 1. Title.',
      'This Ordinance shall be known as the Solid Waste Segregation Ordinance.',
      '',
      'SECTION 2. Declaration of Policy.',
      'The local government unit shall promote ecological solid waste management, waste reduction, and segregation at source.',
      '',
      'SECTION 3. Mandatory Segregation.',
      'All households, establishments, and institutions shall segregate biodegradable, recyclable, residual, and special wastes at source.',
      '',
      'SECTION 4. Collection and Disposal.',
      'The designated office shall publish collection schedules and coordinate lawful transport, recovery, and disposal of solid waste.',
      '',
      'SECTION 5. Prohibited Acts.',
      'Illegal dumping, open burning, mixing of segregated waste, and obstruction of collection operations are prohibited.',
      '',
      'SECTION 6. Penalties and Enforcement.',
      'Violations shall be subject to penalties within the limits authorized for the issuing local government unit, after notice and applicable due process.',
      '',
      'SECTION 7. Separability Clause.',
      'If any provision is declared invalid, the remainder shall continue to be effective.',
      '',
      'SECTION 8. Repealing Clause.',
      'All inconsistent ordinances and issuances are repealed or modified accordingly.',
      '',
      'SECTION 9. Effectivity Clause.',
      'This Ordinance shall take effect after publication, posting, or other required legal steps.',
    ].join('\n'),
  },
  {
    name: 'Business Permit Compliance Ordinance',
    category: 'Revenue',
    subcategory: 'Permits and licensing',
    jurisdiction: ['municipal', 'city'],
    documentType: 'ORDINANCE',
    description: 'Template for business permit registration, renewal, inspection, suspension, and appeal procedures.',
    prompt:
      'Draft a business permit compliance ordinance. Include registration and renewal requirements, inspection authority, notice and hearing before suspension or closure, appeal process, fee coordination, penalties within jurisdiction limits, separability, repealing, and effectivity clauses.',
    body: [
      'SECTION 1. Title.',
      'This Ordinance shall be known as the Business Permit Compliance Ordinance.',
      '',
      'SECTION 2. Scope.',
      'This Ordinance applies to persons and entities conducting business within the territorial jurisdiction of the local government unit.',
      '',
      'SECTION 3. Permit Requirement.',
      'No business shall operate without securing and maintaining the required local permits and clearances.',
      '',
      'SECTION 4. Inspection and Monitoring.',
      'The authorized office may inspect business establishments for compliance with permit conditions, safety rules, zoning requirements, and local ordinances.',
      '',
      'SECTION 5. Notice, Hearing, and Appeal.',
      'Suspension, closure, or revocation shall be preceded by written notice and opportunity to be heard, subject to emergency powers and applicable law.',
      '',
      'SECTION 6. Penalties.',
      'Violations shall be subject to fines, suspension, or other lawful sanctions within the authority of the issuing local government unit.',
      '',
      'SECTION 7. Separability Clause.',
      'If any provision is held invalid, the remaining provisions shall remain effective.',
      '',
      'SECTION 8. Repealing Clause.',
      'All inconsistent issuances are repealed or modified accordingly.',
      '',
      'SECTION 9. Effectivity Clause.',
      'This Ordinance shall take effect after compliance with publication and posting requirements.',
    ].join('\n'),
  },
  {
    name: 'Executive Summary Resolution',
    category: 'Other',
    subcategory: 'Legislative resolution',
    jurisdiction: ['barangay', 'municipal', 'city', 'provincial'],
    documentType: 'RESOLUTION',
    description:
      'Reusable resolution structure for endorsing programs, authorizing actions, or expressing official support.',
    prompt:
      'Draft a concise local government resolution. Include WHEREAS clauses for factual and legal basis, resolved clauses, implementation instructions, and certification language.',
    body: [
      'WHEREAS, the local government unit recognizes the need to act on the subject matter stated in this Resolution;',
      '',
      'WHEREAS, the proposed action is consistent with applicable laws, ordinances, and local development priorities;',
      '',
      'NOW THEREFORE, BE IT RESOLVED, as it is hereby resolved, to approve, endorse, or authorize the action described herein;',
      '',
      'RESOLVED FURTHER, that the concerned office is directed to take the necessary steps for implementation;',
      '',
      'RESOLVED FINALLY, that copies of this Resolution be furnished to concerned offices for their information and appropriate action.',
    ].join('\n'),
  },
];

function buildSections(body: string) {
  const matches = Array.from(
    body.matchAll(/(SECTION\s+\d+[\s.:)-]*[^\n]*)([\s\S]*?)(?=\nSECTION\s+\d+[\s.:)-]*|\s*$)/gi),
  );

  if (matches.length === 0) {
    return [];
  }

  return matches.map((match, index) => ({
    id: `section-${index + 1}`,
    heading: (match[1] ?? `SECTION ${index + 1}.`).trim(),
    body: (match[2] ?? '').trim(),
  }));
}

async function seedTemplates() {
  await prisma.user.upsert({
    where: { email: seedUser.email },
    update: {
      name: seedUser.name,
      emailVerified: true,
    },
    create: {
      id: seedUser.id,
      email: seedUser.email,
      name: seedUser.name,
      emailVerified: true,
      role: 'admin',
    },
  });

  for (const template of templates) {
    const sections = buildSections(template.body);
    const structure = {
      documentType: template.documentType,
      description: template.description,
      prompt: template.prompt,
      body: template.body,
      sections,
    };
    const exampleContent = structure;

    const existing = await prisma.template.findFirst({
      where: {
        name: template.name,
        userId: seedUser.id,
      },
    });

    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          category: template.category,
          subcategory: template.subcategory,
          jurisdiction: template.jurisdiction,
          structure,
          exampleContent,
          isPublic: true,
        },
      });
    } else {
      await prisma.template.create({
        data: {
          name: template.name,
          category: template.category,
          subcategory: template.subcategory,
          jurisdiction: template.jurisdiction,
          structure,
          exampleContent,
          isPublic: true,
          userId: seedUser.id,
        },
      });
    }
  }
}

seedTemplates()
  .then(async () => {
    console.log(`Seeded ${templates.length} public templates.`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Failed to seed database:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
