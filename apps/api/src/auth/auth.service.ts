import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
  role?: string;
}

interface CachedSession {
  user: AuthenticatedUser;
  expiresAt: number;
}

const DEFAULT_SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SESSION_CACHE_SIZE = 10_000;

@Injectable()
export class AuthService {
  private readonly sessionCache = new Map<string, CachedSession>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async verifySession(sessionToken: string): Promise<AuthenticatedUser> {
    const now = Date.now();
    const cached = this.sessionCache.get(sessionToken);

    if (cached) {
      if (cached.expiresAt > now) {
        return cached.user;
      }
      this.sessionCache.delete(sessionToken);
    }

    const session = await this.prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user: AuthenticatedUser = {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name ?? undefined,
      role: session.user.role ?? undefined,
    };

    // Cache with sliding TTL capped by real session expiry
    const ttlExpiresAt = Math.min(now + DEFAULT_SESSION_CACHE_TTL_MS, session.expiresAt.getTime());
    if (ttlExpiresAt > now) {
      if (this.sessionCache.size >= MAX_SESSION_CACHE_SIZE) {
        // Prune first expired entries or clear old half
        this.pruneCache(now);
      }
      this.sessionCache.set(sessionToken, { user, expiresAt: ttlExpiresAt });
    }

    return user;
  }

  invalidateSession(sessionToken: string): void {
    this.sessionCache.delete(sessionToken);
  }

  clearCache(): void {
    this.sessionCache.clear();
  }

  private pruneCache(now: number): void {
    for (const [token, entry] of this.sessionCache.entries()) {
      if (entry.expiresAt <= now) {
        this.sessionCache.delete(token);
      }
    }
    if (this.sessionCache.size >= MAX_SESSION_CACHE_SIZE) {
      const keysToDelete = Array.from(this.sessionCache.keys()).slice(0, 1000);
      for (const k of keysToDelete) {
        this.sessionCache.delete(k);
      }
    }
  }
}
