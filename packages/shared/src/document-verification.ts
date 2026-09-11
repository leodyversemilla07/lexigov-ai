export interface VerificationMetadata {
  documentId: string;
  title: string;
  jurisdictionName: string;
  jurisdiction: string;
  documentType: string;
  version: number;
  status: 'UNVERIFIED';
  verificationHash: string;
  verificationSlug: string;
  verificationUrl: string;
  generatedAt: string;
}

/**
 * SHA-256 content fingerprint, NOT a signature or proof of authenticity/legal validity.
 * JSON encoding prevents ambiguous field boundaries. Full text and version are covered;
 * the wall-clock date is deliberately excluded. Requires Web Crypto (HTTPS or localhost).
 */
export async function generateDocumentFingerprint(
  id: string,
  title: string,
  jurisdiction: string,
  version: number,
  body: string,
): Promise<string> {
  const payload = JSON.stringify(['lexigov-content-v1', id, title, jurisdiction, version, body]);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

/** @deprecated Use generateDocumentFingerprint. A fingerprint does not verify a document. */
export const generateVerificationHash = generateDocumentFingerprint;

/** @deprecated Diagnostic metadata only; no authoritative publication registry exists. */
export async function buildVerificationMetadata(
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
): Promise<VerificationMetadata> {
  return {
    documentId: draft.id,
    title: draft.title,
    jurisdictionName: draft.jurisdictionName,
    jurisdiction: draft.jurisdiction,
    documentType: draft.documentType,
    version: draft.version,
    status: 'UNVERIFIED',
    verificationHash: await generateDocumentFingerprint(draft.id, draft.title, draft.jurisdiction, draft.version, body),
    verificationSlug: `${draft.id}-v${draft.version}`,
    // This informational page always fails closed. Do not embed a purported verification code.
    verificationUrl: '/verify',
    generatedAt: new Date().toISOString(),
  };
}
