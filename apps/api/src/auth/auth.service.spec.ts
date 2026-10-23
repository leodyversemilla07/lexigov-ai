import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

type SessionRecord = {
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    role?: string | null;
    banned?: boolean;
    banExpires?: Date | null;
  };
};

interface PrismaLike {
  session: {
    findUnique: jest.Mock<Promise<SessionRecord | null>, [{ where: { token: string }; include: { user: true } }]>;
  };
}

function buildSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    token: 'session_token_abc',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    user: { id: 'user_1', email: 'user@example.com', name: 'Maria Santos', role: 'user', banned: false },
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaLike;

  beforeEach(() => {
    prisma = { session: { findUnique: jest.fn() } };
    service = new AuthService(prisma as unknown as ConstructorParameters<typeof AuthService>[0]);
  });

  it('loads a valid raw bearer session from the database', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession());
    await expect(service.verifySession('session_token_abc', 'bearer')).resolves.toEqual({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'Maria Santos',
      role: 'user',
    });
  });

  it('validates a signed Better Auth cookie before querying its raw token', async () => {
    const previous = process.env.BETTER_AUTH_SECRET;
    process.env.BETTER_AUTH_SECRET = 'test-secret-at-least-32-characters';
    const token = 'cookie_token';
    const signature = createHmac('sha256', process.env.BETTER_AUTH_SECRET).update(token).digest('base64');
    prisma.session.findUnique.mockResolvedValue(buildSession({ token }));
    try {
      await service.verifySession(`${token}.${signature}`, 'cookie');
      expect(prisma.session.findUnique).toHaveBeenCalledWith({ where: { token }, include: { user: true } });
    } finally {
      if (previous === undefined) delete process.env.BETTER_AUTH_SECRET;
      else process.env.BETTER_AUTH_SECRET = previous;
    }
  });

  it('rejects unsigned and incorrectly signed cookie credentials', async () => {
    await expect(service.verifySession('raw-cookie-token', 'cookie')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.verifySession('token.bad-signature', 'cookie')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
  });

  it('rejects missing, expired, and actively banned sessions', async () => {
    prisma.session.findUnique.mockResolvedValueOnce(null);
    await expect(service.verifySession('missing', 'bearer')).rejects.toBeInstanceOf(UnauthorizedException);

    prisma.session.findUnique.mockResolvedValueOnce(buildSession({ expiresAt: new Date(Date.now() - 1) }));
    await expect(service.verifySession('expired', 'bearer')).rejects.toBeInstanceOf(UnauthorizedException);

    prisma.session.findUnique.mockResolvedValueOnce(
      buildSession({
        user: {
          id: 'u',
          email: 'u@example.com',
          name: null,
          banned: true,
          banExpires: null,
        },
      }),
    );
    await expect(service.verifySession('banned', 'bearer')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not cache authorization state between requests', async () => {
    prisma.session.findUnique.mockResolvedValue(buildSession());
    await service.verifySession('token', 'bearer');
    await service.verifySession('token', 'bearer');
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });
});
