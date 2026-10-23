import { createRequire } from 'node:module';

/**
 * Better Auth's password hashing utilities.
 *
 * `better-auth/crypto` is ESM-only and `@better-auth/utils/password` exposes no
 * top-level `types` entry, so the API (CJS + `moduleResolution: node`) loads the
 * CommonJS build at runtime through `createRequire` with an explicit signature.
 * This keeps hashes byte-compatible with Better Auth sign-in verification.
 */
interface PasswordUtils {
  hashPassword(password: string): Promise<string>;
  verifyPassword(opts: { hash: string; password: string }): Promise<boolean>;
}

const nodeRequire = createRequire(__filename);
const passwordUtils = nodeRequire('@better-auth/utils/password') as PasswordUtils;

export function hashPassword(password: string): Promise<string> {
  return passwordUtils.hashPassword(password);
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return passwordUtils.verifyPassword({ hash, password });
}
