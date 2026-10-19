import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwtSecret = 'unit-test-secret-with-at-least-32-characters';
  let service: AuthService;
  let prisma: {
    appUser: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      appUser: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: '981e2a14-8b91-42cf-a392-9ec47aaef0c5' }),
      },
    };
    const config = {
      getOrThrow: jest.fn().mockReturnValue(jwtSecret),
    } as unknown as ConfigService;
    service = new AuthService(prisma as unknown as PrismaService, config);
  });

  it('hashes passwords with the versioned scrypt format and verifies them', async () => {
    const hash = await service.hashPassword('correct horse battery staple');

    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    await expect(service.verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(service.verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  it('rejects hashes with unexpected cost parameters or malformed fields', async () => {
    await expect(service.verifyPassword('secret', 'bcrypt$anything')).resolves.toBe(false);
    await expect(service.verifyPassword('secret', 'scrypt$1$8$1$abcd$abcd')).resolves.toBe(false);
  });

  it('returns a short-lived bearer token and verifies its claims', async () => {
    const passwordHash = await service.hashPassword('valid-password');
    prisma.appUser.findUnique.mockResolvedValue({
      id: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
      passwordHash,
      isActive: true,
    });

    const result = await service.createSession('agent.one', 'valid-password');
    const claims = service.verifyAccessToken(result.accessToken);

    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(900);
    expect(claims.sub).toBe('981e2a14-8b91-42cf-a392-9ec47aaef0c5');
    expect(claims.iss).toBe('coopeca-api');
    expect(prisma.appUser.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: claims.sub },
    }));
  });

  it('rejects inactive accounts, missing accounts, and incorrect passwords', async () => {
    const passwordHash = await service.hashPassword('valid-password');
    prisma.appUser.findUnique.mockResolvedValue({
      id: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
      passwordHash,
      isActive: false,
    });

    await expect(service.createSession('agent.one', 'valid-password'))
      .rejects.toBeInstanceOf(UnauthorizedException);

    prisma.appUser.findUnique.mockResolvedValue(null);
    await expect(service.createSession('missing.user', 'valid-password'))
      .rejects.toBeInstanceOf(UnauthorizedException);

    prisma.appUser.findUnique.mockResolvedValue({
      id: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
      passwordHash,
      isActive: true,
    });
    await expect(service.createSession('agent.one', 'wrong-password'))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects tampered tokens', async () => {
    const passwordHash = await service.hashPassword('valid-password');
    prisma.appUser.findUnique.mockResolvedValue({
      id: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
      passwordHash,
      isActive: true,
    });
    const { accessToken } = await service.createSession('agent.one', 'valid-password');

    expect(() => service.verifyAccessToken(`${accessToken.slice(0, -1)}x`))
      .toThrow(UnauthorizedException);
  });
});