import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedUser, AuthService } from './auth.service';

type HttpRequest = {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedUser;
};

interface AuthServiceLike {
  verifySession: jest.Mock<Promise<AuthenticatedUser>, [string]>;
}

function buildContext(req: HttpRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
    getArgs: () => [] as never,
    getArgByIndex: () => ({}) as never,
    switchToRpc: () => ({}) as never,
    switchToWs: () => ({}) as never,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let authService: AuthServiceLike;
  let guard: AuthGuard;

  beforeEach(() => {
    authService = {
      verifySession: jest.fn(),
    };
    guard = new AuthGuard(authService as unknown as AuthService);
  });

  it('extracts a Bearer token from the Authorization header and attaches the user', async () => {
    authService.verifySession.mockResolvedValue({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'Maria',
    });
    const req: HttpRequest = {
      headers: { authorization: 'Bearer session_token_xyz' },
    };

    const result = await guard.canActivate(buildContext(req));

    expect(result).toBe(true);
    expect(req.user).toEqual({ userId: 'user_1', email: 'user@example.com', name: 'Maria' });
    expect(authService.verifySession).toHaveBeenCalledWith('session_token_xyz');
  });

  it('falls back to the better-auth session cookie when no header is present', async () => {
    authService.verifySession.mockResolvedValue({ userId: 'user_2', email: 'a@b.com' });
    const req: HttpRequest = {
      headers: { cookie: 'better-auth.session_token=cookie_token_123; other=foo' },
    };

    await guard.canActivate(buildContext(req));

    expect(authService.verifySession).toHaveBeenCalledWith('cookie_token_123');
  });

  it('falls back to the secure better-auth session cookie name in production', async () => {
    authService.verifySession.mockResolvedValue({ userId: 'user_3', email: 'secure@example.com' });
    const req: HttpRequest = {
      headers: { cookie: '__Secure-better-auth.session_token=secure_cookie_token; other=foo' },
    };

    await guard.canActivate(buildContext(req));

    expect(authService.verifySession).toHaveBeenCalledWith('secure_cookie_token');
  });

  it('URL-decodes the cookie token before delegating to the auth service', async () => {
    authService.verifySession.mockResolvedValue({ userId: 'u', email: 'e@e.com' });
    const req: HttpRequest = {
      headers: { cookie: 'better-auth.session_token=token%20with%20spaces' },
    };

    await guard.canActivate(buildContext(req));

    expect(authService.verifySession).toHaveBeenCalledWith('token with spaces');
  });

  it('preserves a single leading space in the bearer token when there is a double space (documented behavior)', async () => {
    // "Bearer  token" has a double space; slice(7) leaves a leading space.
    // The guard currently passes that to verifySession unchanged. This test
    // documents the actual behavior so a future change is intentional.
    authService.verifySession.mockResolvedValue({ userId: 'u', email: 'e@e.com' });
    const req: HttpRequest = {
      headers: { authorization: 'Bearer  token_with_double_space' },
    };

    await guard.canActivate(buildContext(req));

    expect(authService.verifySession).toHaveBeenCalledWith(' token_with_double_space');
  });

  it('ignores a cookie that does not have the better-auth.session_token prefix', async () => {
    // A generic cookie without the prefix should not be parsed as a session
    // token. The guard should fall through to "no token" and throw.
    const req: HttpRequest = { headers: { cookie: 'other_cookie=value; theme=dark' } };

    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.verifySession).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when neither header nor cookie is present', async () => {
    const req: HttpRequest = { headers: {} };

    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.verifySession).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the Authorization header is not a Bearer token', async () => {
    const req: HttpRequest = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };

    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.verifySession).not.toHaveBeenCalled();
  });

  it('does not call verifySession when the authorization header is a non-string array', async () => {
    // Express can deliver headers as arrays in some proxy setups. The guard's
    // `authHeader?.startsWith(...)` returns undefined for arrays, so the
    // auth-header branch is skipped and the cookie branch runs. With no
    // cookie, the guard throws UnauthorizedException. The key invariant is
    // that an array-shaped header must never reach verifySession.
    const req: HttpRequest = {
      headers: { authorization: ['Bearer one', 'Bearer two'] as unknown as string },
    };

    await expect(guard.canActivate(buildContext(req))).rejects.toBeDefined();
    expect(authService.verifySession).not.toHaveBeenCalled();
  });

  it('propagates UnauthorizedException from the underlying auth service', async () => {
    authService.verifySession.mockRejectedValue(new UnauthorizedException('Invalid or expired session'));
    const req: HttpRequest = { headers: { authorization: 'Bearer stale' } };

    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
