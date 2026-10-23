import type Redis from 'ioredis';
import type { AuthenticatedUser } from './auth.service';
import { InMemorySessionCache, RedisSessionCache, SESSION_CACHE, type SessionCache } from './session-cache.service';

describe('SessionCache implementations', () => {
  describe('InMemorySessionCache', () => {
    it('returns cached user and respects TTL', async () => {
      const cache: SessionCache = new InMemorySessionCache();
      const user: AuthenticatedUser = { userId: 'user_1', email: 'user@example.com', name: 'Maria' };

      await cache.set('token_a', user, Date.now() + 60_000);
      const cached = await cache.get('token_a', Date.now());

      expect(cached?.user.userId).toBe('user_1');
      expect(cached?.expiresAt).toBeGreaterThan(Date.now());
      expect(await cache.get('token_missing')).toBeNull();
    });

    it('returns null for expired entries', async () => {
      const cache: SessionCache = new InMemorySessionCache();
      await cache.set('token_b', { userId: 'user_2', email: 'b@example.com' }, Date.now() - 1000);

      expect(await cache.get('token_b', Date.now())).toBeNull();
    });

    it('deletes tokens and clears the cache', async () => {
      const cache: SessionCache = new InMemorySessionCache();
      await cache.set('token_c', { userId: 'user_3', email: 'c@example.com' }, Date.now() + 60_000);
      await cache.del('token_c');
      expect(await cache.get('token_c')).toBeNull();

      await cache.set('token_d', { userId: 'user_4', email: 'd@example.com' }, Date.now() + 60_000);
      await cache.clear();
      expect(await cache.get('token_d')).toBeNull();
    });
  });

  describe('RedisSessionCache', () => {
    const buildFakeClient = (): Redis =>
      ({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
        flushdb: jest.fn(),
      }) as unknown as Redis;

    it('stores and retrieves a session with sliding TTL', async () => {
      const client = buildFakeClient();
      const cache = new RedisSessionCache('redis://localhost:6379', 300, client);
      const user: AuthenticatedUser = { userId: 'user_1', email: 'user@example.com', name: 'Maria' };

      await cache.set('token_redis', user, Date.now() + 60_000, Date.now());
      (client.get as jest.Mock).mockResolvedValue(JSON.stringify({ user, expiresAt: Date.now() + 60_000 }));

      const cached = await cache.get('token_redis', Date.now());

      expect(cached?.user.userId).toBe('user_1');
      expect(client.expire).toHaveBeenCalled();
    });

    it('returns null and evicts when the cached session has expired', async () => {
      const client = buildFakeClient();
      const cache = new RedisSessionCache('redis://localhost:6379', 300, client);
      (client.get as jest.Mock).mockResolvedValue(
        JSON.stringify({ user: { userId: 'u', email: 'e@e.com' }, expiresAt: Date.now() - 1000 }),
      );

      expect(await cache.get('token_redis', Date.now())).toBeNull();
      expect(client.del).toHaveBeenCalled();
    });

    it('deletes session keys', async () => {
      const client = buildFakeClient();
      const cache = new RedisSessionCache('redis://localhost:6379', 300, client);

      await cache.del('token_redis');

      expect(client.del).toHaveBeenCalledWith('session:token_redis');
    });

    it('clears the cache', async () => {
      const client = buildFakeClient();
      const cache = new RedisSessionCache('redis://localhost:6379', 300, client);

      await cache.clear();

      expect(client.flushdb).toHaveBeenCalled();
    });
  });

  it('exports the session cache token', () => {
    expect(SESSION_CACHE).toBeDefined();
  });
});
