/**
 * ThrottlerGuard variant that keys rate-limit buckets by the authenticated user
 * when an AuthGuard has already populated `request.user`. Because this guard is
 * registered globally, it can run before route-level AuthGuard instances; in
 * that case, key by the Better Auth session token hash instead of collapsing all
 * authenticated users behind the same IP bucket. Falls back to client IP for
 * unauthenticated requests.
 */
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestLike = {
  headers?: {
    authorization?: string;
    cookie?: string;
  };
  ip?: string;
  user?: { userId?: string };
};

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex').slice(0, 32);
}

function extractSessionToken(req: RequestLike) {
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookie = req.headers?.cookie;
  if (!cookie) {
    return null;
  }

  const match = cookie.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

@Injectable()
export class ThrottlerBehindAuthGuard extends ThrottlerGuard {
  protected async getTracker(req: RequestLike): Promise<string> {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }

    const sessionToken = extractSessionToken(req);
    if (sessionToken) {
      return `session:${hashToken(sessionToken)}`;
    }

    return `ip:${req.ip ?? 'unknown'}`;
  }
}
