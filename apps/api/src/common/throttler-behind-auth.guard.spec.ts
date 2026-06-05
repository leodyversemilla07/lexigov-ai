import { ThrottlerBehindAuthGuard } from './throttler-behind-auth.guard';

/**
 * Subclass that exposes the protected getTracker method for testing.
 * Avoids using `(guard as unknown as { getTracker }).getTracker` casts.
 */
class TestableThrottlerGuard extends ThrottlerBehindAuthGuard {
  public async trackerFor(req: Record<string, unknown>): Promise<string> {
    return this.getTracker(req);
  }
}

describe('ThrottlerBehindAuthGuard', () => {
  let guard: TestableThrottlerGuard;

  beforeEach(() => {
    // The base ThrottlerGuard constructor accepts (options, storageService, reflector)
    // but getTracker doesn't use any of them, so we pass sentinel objects.
    const sentinel = {} as never;
    guard = new TestableThrottlerGuard(sentinel, sentinel, sentinel);
  });

  it('keys the bucket by the authenticated user id when present', async () => {
    const req = { user: { userId: 'user_123' }, ip: '127.0.0.1' };
    await expect(guard.trackerFor(req)).resolves.toBe('user:user_123');
  });

  it('falls back to the request ip for unauthenticated requests', async () => {
    const req = { ip: '10.0.0.5' };
    await expect(guard.trackerFor(req)).resolves.toBe('ip:10.0.0.5');
  });

  it('uses an "unknown" tracker when neither user nor ip is available', async () => {
    const req = {};
    await expect(guard.trackerFor(req)).resolves.toBe('ip:unknown');
  });

  it('ignores a user object without a userId', async () => {
    const req = { user: {}, ip: '192.168.1.1' };
    await expect(guard.trackerFor(req)).resolves.toBe('ip:192.168.1.1');
  });
});
