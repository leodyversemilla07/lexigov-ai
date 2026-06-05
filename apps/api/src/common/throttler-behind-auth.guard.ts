/**
 * ThrottlerGuard variant that keys rate-limit buckets by the authenticated user
 * when an AuthGuard has already populated `request.user`. Falls back to the
 * client IP for unauthenticated requests so the API still has a sensible limit.
 */
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindAuthGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as { userId?: string } | undefined;
    if (user?.userId) {
      return `user:${user.userId}`;
    }
    return `ip:${req.ip ?? 'unknown'}`;
  }
}
