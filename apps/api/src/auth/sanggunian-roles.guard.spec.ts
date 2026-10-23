import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PrismaService } from '../prisma/prisma.service';
import { SanggunianRolesGuard } from './sanggunian-roles.guard';

function buildContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('SanggunianRolesGuard', () => {
  let reflector: Reflector;
  let prisma: { member: { findUnique: jest.Mock } };
  let guard: SanggunianRolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = { member: { findUnique: jest.fn() } };
    guard = new SanggunianRolesGuard(reflector, prisma as unknown as PrismaService);
  });

  it('allows access when no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await expect(guard.canActivate(buildContext({ headers: {}, user: { userId: 'u1' } }))).resolves.toBe(true);
  });

  it('requires the authenticated userId shape', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PRESIDING_OFFICER']);
    await expect(guard.canActivate(buildContext({ headers: {}, user: { id: 'wrong-shape' } }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('ignores a client-provided role header', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PRESIDING_OFFICER']);
    await expect(
      guard.canActivate(
        buildContext({
          headers: { 'x-sanggunian-role': 'PRESIDING_OFFICER' },
          user: { userId: 'u1', role: 'user' },
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('uses persisted organization membership role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SANGGUNIAN_SECRETARY']);
    prisma.member.findUnique.mockResolvedValue({ organizationId: 'org', userId: 'u1', role: 'SANGGUNIAN_SECRETARY' });
    const request = { headers: { 'x-organization-id': 'org' }, user: { userId: 'u1', role: 'user' } };

    await expect(guard.canActivate(buildContext(request))).resolves.toBe(true);
    expect(prisma.member.findUnique).toHaveBeenCalledWith({
      where: { organizationId_userId: { organizationId: 'org', userId: 'u1' } },
    });
  });

  it('rejects users who are not members of the requested organization', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SANGGUNIAN_SECRETARY']);
    prisma.member.findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(
        buildContext({
          headers: { 'x-organization-id': 'org' },
          user: { userId: 'u1', role: 'ADMIN' },
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a persisted LGU administrator membership', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['LCE_OFFICE']);
    prisma.member.findUnique.mockResolvedValue({ organizationId: 'org', userId: 'u1', role: 'owner' });
    await expect(
      guard.canActivate(
        buildContext({
          headers: { 'x-organization-id': 'org' },
          user: { userId: 'u1', role: 'user' },
        }),
      ),
    ).resolves.toBe(true);
  });
});
