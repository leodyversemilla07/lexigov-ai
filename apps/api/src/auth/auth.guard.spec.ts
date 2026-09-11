import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedUser, AuthService } from './auth.service';

type HttpRequest = {
  method?: string;
  headers: Record<string, unknown>;
  user?: AuthenticatedUser;
};

interface AuthServiceLike {
  verifySession: jest.Mock<Promise<AuthenticatedUser>, [string, 'bearer' | 'cookie']>;
}

function buildContext(req: HttpRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let authService: AuthServiceLike;
  let guard: AuthGuard;

  beforeEach(() => {
    authService = { verifySession: jest.fn() };
    guard = new AuthGuard(authService as unknown as AuthService);
  });

  it('accepts a strict Bearer credential and attaches the verified user', async () => {
    authService.verifySession.mockResolvedValue({ userId: 'user_1', email: 'user@example.com' });
    const req: HttpRequest = { method: 'GET', headers: { authorization: 'Bearer session_token_xyz' } };

    await expect(guard.canActivate(buildContext(req))).resolves.toBe(true);
    expect(req.user?.userId).toBe('user_1');
    expect(authService.verifySession).toHaveBeenCalledWith('session_token_xyz', 'bearer');
  });

  it('passes an encoded signed Better Auth cookie as a cookie credential', async () => {
    authService.verifySession.mockResolvedValue({ userId: 'user_2', email: 'a@b.com' });
    const req: HttpRequest = {
      method: 'GET',
      headers: { cookie: '__Secure-better-auth.session_token=token.signature%3D; other=foo' },
    };

    await guard.canActivate(buildContext(req));
    expect(authService.verifySession).toHaveBeenCalledWith('token.signature=', 'cookie');
  });

  it('rejects malformed bearer spacing rather than normalizing attacker input', async () => {
    const req: HttpRequest = { method: 'GET', headers: { authorization: 'Bearer  token' } };
    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.verifySession).not.toHaveBeenCalled();
  });

  it('rejects invalid cookie encoding without throwing URIError', async () => {
    const req: HttpRequest = { method: 'GET', headers: { cookie: 'better-auth.session_token=%E0%A4%A' } };
    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires a trusted Origin for state-changing cookie-authenticated requests', async () => {
    const req: HttpRequest = { method: 'PATCH', headers: { cookie: 'better-auth.session_token=token.signature' } };
    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(ForbiddenException);
    expect(authService.verifySession).not.toHaveBeenCalled();
  });

  it('allows a configured Origin for state-changing cookie requests', async () => {
    const previous = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'https://app.example.gov.ph';
    authService.verifySession.mockResolvedValue({ userId: 'u', email: 'e@example.com' });
    const req: HttpRequest = {
      method: 'POST',
      headers: {
        cookie: 'better-auth.session_token=token.signature',
        origin: 'https://app.example.gov.ph',
      },
    };
    try {
      await expect(guard.canActivate(buildContext(req))).resolves.toBe(true);
    } finally {
      if (previous === undefined) delete process.env.CORS_ORIGIN;
      else process.env.CORS_ORIGIN = previous;
    }
  });

  it('rejects missing and non-string credentials', async () => {
    await expect(guard.canActivate(buildContext({ method: 'GET', headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      guard.canActivate(buildContext({ method: 'GET', headers: { authorization: ['Bearer one'] } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
