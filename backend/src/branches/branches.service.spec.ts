import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { BranchesService } from './branches.service';

describe('BranchesService administration', () => {
  it('refuses full branch listing to non-admin roles before querying the database', async () => {
    const prisma = { branch: { findMany: jest.fn() } } as unknown as PrismaService;
    const service = new BranchesService(prisma);
    const supervisor: AuthenticatedPrincipal = {
      id: 'supervisor-id',
      username: 'supervisor1',
      fullName: 'Supervisor Test',
      role: 'SUPERVISOR',
      branches: [{ id: 'branch-id', code: 'BR-1', name: 'Agence test' }],
    };

    await expect(service.findAll(supervisor)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.branch.findMany).not.toHaveBeenCalled();
  });
});
