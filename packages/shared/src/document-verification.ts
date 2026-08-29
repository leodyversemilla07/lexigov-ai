export interface VerificationMetadata {
  documentId: string;
  title: string;
  jurisdictionName: string;
  jurisdiction: string;
  documentType: string;
  version: number;
  status: string;
  verificationHash: string;
  verificationSlug: string;
  verificationUrl: string;
  generatedAt: string;
}

/**
 * Generates a deterministic short hash / verification fingerprint from document attributes.
 */
export function generateVerificationHash(
  id: string,
  title: string,
  jurisdiction: string,
  version: number,
  body: string,
): string {
  const payload = `${id}|${title}|${jurisdiction}|v${version}|${body.length}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const year = new Date().getFullYear();
  return `LXG-${year}-${hex}`;
}

export function buildVerificationMetadata(
  draft: {
    id: string;
    title: string;
    jurisdictionName: string;
    jurisdiction: string;
    documentType: string;
    version: number;
    status: string;
  },
  body: string,
  baseUrl = 'https://lexigov.ph',
): VerificationMetadata {
  const verificationHash = generateVerificationHash(draft.id, draft.title, draft.jurisdiction, draft.version, body);
  const verificationSlug = `${draft.id}-v${draft.version}`;
  const verificationUrl = `${baseUrl}/verify?code=${verificationHash}&id=${draft.id}`;

  return {
    documentId: draft.id,
    title: draft.title,
    jurisdictionName: draft.jurisdictionName,
    jurisdiction: draft.jurisdiction,
    documentType: draft.documentType,
    version: draft.version,
    status: draft.status,
    verificationHash,
    verificationSlug,
    verificationUrl,
    generatedAt: new Date().toISOString(),
  };
}
