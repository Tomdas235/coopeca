import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  const claims = {
    sub: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
    iat: 1_800_000_000,
    exp: 1_800_000_900,
    iss: 'coopeca-api' as const,
  };
  let authService: { verifyAccessToken: jest.Mock };
  let prisma: { appUser: { findUnique: jest.Mock } };
  let guard: AuthGuard;
  let request: { headers: Record<string, string>; user?: unknown };

  beforeEach(() => {
    authService = { verifyAccessToken: jest.fn().mockReturnValue(claims) };
    prisma = { appUser: { findUnique: jest.fn() } };
    guard = new AuthGuard(
      authService as unknown as AuthService,
      prisma as unknown as PrismaService,
    );
    request = { headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1In0.signature' } };
  });

  function context(): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('reloads the active account and only its active agency grants', async () => {
    prisma.appUser.findUnique.mockResolvedValue({
      id: claims.sub,
      username: 'agent.one',
      fullName: 'Agent One',
      role: 'AGENT',
      isActive: true,
      branchAccesses: [
        { isPrimary: true, branch: { id: 'branch-a', code: 'A', name: 'Agence A', isActive: true } },
        { isPrimary: false, branch: { id: 'branch-b', code: 'B', name: 'Agence B', isActive: false } },
      ],
    });

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(prisma.appUser.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: claims.sub },
    }));
    expect(request.user).toEqual({
      id: claims.sub,
      username: 'agent.one',
      fullName: 'Agent One',
      role: 'AGENT',
      branches: [{ id: 'branch-a', code: 'A', name: 'Agence A' }],
    });
  });

  it('rejects missing bearer credentials', async () => {
    request.headers = {};
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.appUser.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a disabled or missing account after token validation', async () => {
    prisma.appUser.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });
});