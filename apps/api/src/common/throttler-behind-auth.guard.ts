import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface RequestLike {
  ip?: string;
  user?: { userId?: string };
}

/** Never derive rate-limit identities from unverified, attacker-controlled tokens. */
@Injectable()
export class ThrottlerBehindAuthGuard extends ThrottlerGuard {
  protected async getTracker(req: RequestLike): Promise<string> {
    if (req.user?.userId) return `user:${req.user.userId}`;
    // Global guards execute before route authentication, so the initial limit is per IP.
    return `ip:${req.ip ?? 'unknown'}`;
  }
}
