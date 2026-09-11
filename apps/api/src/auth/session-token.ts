import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SessionCredential {
  token: string;
  source: 'bearer' | 'cookie';
}

/** Parse only exact cookie names. Invalid encodings are authentication failures, not server errors. */
export function extractSessionCredential(headers: {
  authorization?: unknown;
  cookie?: unknown;
}): SessionCredential | null {
  if (headers.authorization !== undefined) {
    if (typeof headers.authorization !== 'string') return null;
    const match = /^Bearer (\S+)$/i.exec(headers.authorization);
    if (!match?.[1]) return null;
    try {
      return { token: decodeURIComponent(match[1]), source: 'bearer' };
    } catch {
      return null;
    }
  }

  if (typeof headers.cookie !== 'string') return null;
  const cookies = headers.cookie.split(';').map((cookie) => cookie.trim());
  // Prefer the secure cookie if both names are present.
  for (const name of ['__Secure-better-auth.session_token', 'better-auth.session_token']) {
    const value = cookies.find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1);
    if (!value) continue;
    try {
      return { token: decodeURIComponent(value), source: 'cookie' };
    } catch {
      return null;
    }
  }
  return null;
}

/** Better Auth signs cookies as token + '.' + base64(HMAC-SHA256(token, secret)). */
export function resolveSessionToken(credential: SessionCredential, secret?: string): string | null {
  const separator = credential.token.lastIndexOf('.');
  if (separator === -1) {
    // The Better Auth bearer plugin also supports raw session tokens for non-browser clients.
    return credential.source === 'bearer' && /^\S+$/.test(credential.token) ? credential.token : null;
  }
  if (!secret || separator === 0) return null;

  const token = credential.token.slice(0, separator);
  const signature = credential.token.slice(separator + 1);
  if (!/^[A-Za-z0-9+/]{43}=$/.test(signature)) return null;
  const expected = createHmac('sha256', secret).update(token).digest();
  const received = Buffer.from(signature, 'base64');
  return received.length === expected.length && timingSafeEqual(received, expected) ? token : null;
}
