import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { ReferenceService } from '../common/reference.service';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: ReferenceService,
  ) {}

  async findAll(actor: AuthenticatedPrincipal) {
    this.requireAdmin(actor);
    return this.prisma.branch.findMany({
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
      include: {
        market: { select: { id: true, code: true, name: true, isActive: true } },
        _count: { select: { clients: true, userAccesses: true } },
      },
    });
  }

  async create(
    actor: AuthenticatedPrincipal,
    input: { name: string; address?: string | null; phone?: string | null; marketId: string },
  ) {
    this.requireAdmin(actor);
    const market = await this.prisma.market.findUnique({
      where: { id: input.marketId },
      select: { id: true, isActive: true },
    });
    if (!market?.isActive) throw new NotFoundException('Marché actif introuvable.');

    // Génération automatique du code agence (côté serveur uniquement)
    const code = await this.referenceService.generateReference({
      entity: 'Branch',
      field: 'code',
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const branch = await tx.branch.create({
          data: {
            code,
            name: input.name,
            address: input.address || null,
            phone: input.phone || null,
            marketId: input.marketId,
          },
          include: { market: { select: { id: true, code: true, name: true, isActive: true } } },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            branchId: branch.id,
            action: 'BRANCH_CREATED',
            entityType: 'branches',
            entityId: branch.id,
            afterData: { code: branch.code, name: branch.name, marketId: branch.marketId },
            requestId: randomUUID(),
          },
        });
        return branch;
      });
    } catch (error) {
      if (this.isPrismaCode(error, 'P2002')) {
        throw new ConflictException('Ce code agence est déjà utilisé.');
      }
      throw error;
    }
  }

  async update(
    actor: AuthenticatedPrincipal,
    id: string,
    input: { name?: string; address?: string | null; phone?: string | null; isActive?: boolean },
  ) {
    this.requireAdmin(actor);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.branch.findUnique({
        where: { id },
        select: { id: true, code: true, name: true, address: true, phone: true, isActive: true, marketId: true },
      });
      if (!current) throw new NotFoundException('Agence introuvable.');

      const updated = await tx.branch.update({
        where: { id },
        data: { ...input, updatedAt: new Date() },
        include: { market: { select: { id: true, code: true, name: true, isActive: true } } },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: id,
          action: input.isActive === false ? 'BRANCH_DEACTIVATED' : input.isActive === true ? 'BRANCH_REACTIVATED' : 'BRANCH_UPDATED',
          entityType: 'branches',
          entityId: id,
          beforeData: { name: current.name, address: current.address, phone: current.phone, isActive: current.isActive },
          afterData: { name: updated.name, address: updated.address, phone: updated.phone, isActive: updated.isActive },
          requestId: randomUUID(),
        },
      });
      return updated;
    });
  }

  private requireAdmin(actor: AuthenticatedPrincipal): void {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Seul un administrateur peut gérer les agences.');
  }

  private isPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
  }
}