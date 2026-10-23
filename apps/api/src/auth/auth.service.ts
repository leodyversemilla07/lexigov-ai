import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type CachedSession, InMemorySessionCache, SESSION_CACHE, type SessionCache } from './session-cache.service';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
  role?: string;
}

const DEFAULT_SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AuthService {
  private readonly sessionCache: SessionCache;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(SESSION_CACHE) injectedCache?: SessionCache,
  ) {
    this.sessionCache = injectedCache ?? new InMemorySessionCache();
  }

  async verifySession(sessionToken: string): Promise<AuthenticatedUser> {
    const cached = await this.sessionCache.get(sessionToken, Date.now());

    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
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
    const ttlExpiresAt = Math.min(Date.now() + DEFAULT_SESSION_CACHE_TTL_MS, session.expiresAt.getTime());
    if (ttlExpiresAt > Date.now()) {
      await this.sessionCache.set(sessionToken, user, ttlExpiresAt, Date.now());
    }

    return user;
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    await this.sessionCache.del(sessionToken);
  }

  async clearCache(): Promise<void> {
    await this.sessionCache.clear();
  }
}

export type { CachedSession };
