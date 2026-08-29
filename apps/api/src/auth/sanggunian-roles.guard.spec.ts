import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PrismaService } from '../prisma/prisma.service';
import { SanggunianRolesGuard } from './sanggunian-roles.guard';

function buildContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
  } as unknown as ExecutionContext;
}

describe('SanggunianRolesGuard', () => {
  let reflector: Reflector;
  let prisma: { member: { findUnique: jest.Mock } };
  let guard: SanggunianRolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      member: { findUnique: jest.fn() },
    };
    guard = new SanggunianRolesGuard(reflector, prisma as unknown as PrismaService);
  });

  it('allows access when no roles are required on handler or class', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = buildContext({ user: { id: 'u1' } });

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
  });

  it('throws UnauthorizedException when user is not present on request', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PRESIDING_OFFICER']);
    const context = buildContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('allows access when x-sanggunian-role header matches required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PRESIDING_OFFICER']);
    const context = buildContext({
      headers: { 'x-sanggunian-role': 'PRESIDING_OFFICER' },
      user: { id: 'u1', role: 'LEGISLATIVE_STAFF' },
    });

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
  });

  it('allows access when organization membership matches required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SANGGUNIAN_SECRETARY']);
    prisma.member.findUnique.mockResolvedValue({
      organizationId: 'org_pasig',
      userId: 'u1',
      role: 'SANGGUNIAN_SECRETARY',
    });

    const context = buildContext({
      headers: { 'x-organization-id': 'org_pasig' },
      user: { id: 'u1', role: 'LEGISLATIVE_STAFF' },
    });

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
  });

  it('throws ForbiddenException when role does not match requirements', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['LCE_OFFICE']);
    prisma.member.findUnique.mockResolvedValue({
      organizationId: 'org_pasig',
      userId: 'u1',
      role: 'LEGISLATIVE_STAFF',
    });

    const context = buildContext({
      headers: { 'x-organization-id': 'org_pasig' },
      user: { id: 'u1', role: 'LEGISLATIVE_STAFF' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('always allows LGU_ADMIN access to any role-guarded handler', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['LCE_OFFICE']);
    prisma.member.findUnique.mockResolvedValue({
      organizationId: 'org_pasig',
      userId: 'u1',
      role: 'LGU_ADMIN',
    });

    const context = buildContext({
      headers: { 'x-organization-id': 'org_pasig' },
      user: { id: 'u1', role: 'user' },
    });

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
  });
});
