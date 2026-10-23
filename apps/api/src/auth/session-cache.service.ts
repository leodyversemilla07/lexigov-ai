import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { AuthenticatedUser } from './auth.service';

export interface CachedSession {
  user: AuthenticatedUser;
  expiresAt: number;
}

export interface SessionCache {
  get(sessionToken: string, now?: number): Promise<CachedSession | null>;
  set(sessionToken: string, user: AuthenticatedUser, expiresAt: number, now?: number): Promise<void>;
  del(sessionToken: string): Promise<void>;
  clear(): Promise<void>;
}

export const SESSION_CACHE = Symbol('SESSION_CACHE');

const DEFAULT_SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SESSION_CACHE_SIZE = 10_000;

@Injectable()
export class InMemorySessionCache implements SessionCache {
  private readonly entries = new Map<string, CachedSession>();

  async get(sessionToken: string, now: number = Date.now()): Promise<CachedSession | null> {
    const cached = this.entries.get(sessionToken);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt <= now) {
      this.entries.delete(sessionToken);
      return null;
    }

    return cached;
  }

  async set(sessionToken: string, user: AuthenticatedUser, expiresAt: number, now: number = Date.now()): Promise<void> {
    if (expiresAt <= now) {
      return;
    }

    if (this.entries.size >= MAX_SESSION_CACHE_SIZE) {
      this.prune(now);
    }

    this.entries.set(sessionToken, { user, expiresAt });
  }

  async del(sessionToken: string): Promise<void> {
    this.entries.delete(sessionToken);
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  private prune(now: number): void {
    for (const [token, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(token);
      }
    }

    if (this.entries.size >= MAX_SESSION_CACHE_SIZE) {
      const keysToDelete = Array.from(this.entries.keys()).slice(0, 1000);
      for (const key of keysToDelete) {
        this.entries.delete(key);
      }
    }
  }
}

/**
 * Redis-backed session cache. Uses the `session:<token>` key namespace with a
 * sliding TTL (default 5 minutes, capped by the real session expiry).
 */
@Injectable()
export class RedisSessionCache implements SessionCache {
  private readonly client: Redis;

  constructor(redisUrl: string, sessionTtlMs: number = DEFAULT_SESSION_CACHE_TTL_MS, client?: Redis) {
    this.client = client ?? new Redis(redisUrl);
  }

  async get(sessionToken: string, now: number = Date.now()): Promise<CachedSession | null> {
    const key = `session:${sessionToken}`;
    const raw = await this.client.get(key);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw) as { user: AuthenticatedUser; expiresAt: number };
    const expiresAt = Number(parsed.expiresAt);
    if (expiresAt <= now) {
      await this.client.del(key);
      return null;
    }

    // Sliding expiration: refresh TTL on access.
    const ttlSeconds = Math.max(1, Math.ceil((expiresAt - now) / 1000));
    await this.client.expire(key, ttlSeconds);

    return { user: parsed.user, expiresAt };
  }

  async set(sessionToken: string, user: AuthenticatedUser, expiresAt: number, now: number = Date.now()): Promise<void> {
    const key = `session:${sessionToken}`;
    const ttlSeconds = Math.max(1, Math.ceil((expiresAt - now) / 1000));
    await this.client.set(key, JSON.stringify({ user, expiresAt }), 'EX', ttlSeconds);
  }

  async del(sessionToken: string): Promise<void> {
    await this.client.del(`session:${sessionToken}`);
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }
}
