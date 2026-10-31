import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from './users.service';

describe('UsersService account administration', () => {
  it('refuses account listing to non-admin roles before querying the database', async () => {
    const prisma = {
      appUser: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as unknown as PrismaService;
    const service = new UsersService(prisma);
    const agent: AuthenticatedPrincipal = {
      id: 'agent-id',
      username: 'agent1',
      fullName: 'Agent Test',
      role: 'AGENT',
      branches: [],
    };

    await expect(service.findAll(agent, {})).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.appUser.findMany).not.toHaveBeenCalled();
    expect(prisma.appUser.count).not.toHaveBeenCalled();
  });
});
