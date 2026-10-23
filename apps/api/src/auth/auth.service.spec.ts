import { UnauthorizedException } from '@nestjs/common';
import { type AuthenticatedUser, AuthService } from './auth.service';
import { InMemorySessionCache } from './session-cache.service';

type SessionRecord = {
  token: string;
  expiresAt: Date;
  user: { id: string; email: string; name: string | null };
};

interface PrismaLike {
  session: {
    findUnique: jest.Mock<Promise<SessionRecord | null>, [{ where: { token: string } }]>;
  };
}

function buildPrismaStub(): PrismaLike {
  return {
    session: {
      findUnique: jest.fn(),
    },
  };
}

function buildSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    token: 'session_token_abc',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    user: { id: 'user_1', email: 'user@example.com', name: 'Maria Santos' },
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaLike;

  beforeEach(() => {
    prisma = buildPrismaStub();
    // Cast through unknown to keep the test independent of generated Prisma types.
    service = new AuthService(prisma as unknown as ConstructorParameters<typeof AuthService>[0]);
  });

  it('returns the authenticated user for a valid, non-expired session', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession());

    const result: AuthenticatedUser = await service.verifySession('session_token_abc');

    expect(result).toEqual({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'Maria Santos',
    });
    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { token: 'session_token_abc' },
      include: { user: true },
    });
  });

  it('converts a null name to undefined on the returned user', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession({ user: { id: 'u2', email: 'e@x.com', name: null } }));

    const result = await service.verifySession('session_token_abc');

    expect(result.name).toBeUndefined();
    expect(result.userId).toBe('u2');
  });

  it('throws UnauthorizedException when the session does not exist', async () => {
    prisma.session.findUnique.mockResolvedValue(null);

    await expect(service.verifySession('missing_token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when the session is expired', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(service.verifySession('expired_token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('treats a session that expires in the future as still valid', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession({ expiresAt: new Date(Date.now() + 60_000) }));

    const result = await service.verifySession('fresh_token');
    expect(result.userId).toBe('user_1');
  });

  it('serves subsequent verifications from memory cache without querying database again', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession({ token: 'cached_token' }));

    const first = await service.verifySession('cached_token');
    const second = await service.verifySession('cached_token');

    expect(first.userId).toBe('user_1');
    expect(second.userId).toBe('user_1');
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(1);
  });

  it('purges token from cache when invalidateSession is called', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession({ token: 'invalidated_token' }));

    await service.verifySession('invalidated_token');
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(1);

    await service.invalidateSession('invalidated_token');

    await service.verifySession('invalidated_token');
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });

  it('uses the injected session cache when one is provided', async () => {
    const fakeCache = new InMemorySessionCache();
    const cachedUser = { userId: 'user_1', email: 'user@example.com', name: 'Maria Santos' };
    await fakeCache.set('injected_token', cachedUser, Date.now() + 60_000);

    const cachedService = new AuthService(prisma as unknown as ConstructorParameters<typeof AuthService>[0], fakeCache);

    const result = await cachedService.verifySession('injected_token');

    expect(result.userId).toBe('user_1');
    // Served from cache: no database round trip.
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
  });
});
