import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CyclesService as OriginalCyclesService } from '../cycles/cycles.service';

@Injectable()
export class AdminCyclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cyclesService: OriginalCyclesService,
  ) {}

  async listMarkets(actor: any) {
    return this.prisma.market.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, code: true, name: true, isActive: true, createdAt: true },
    });
  }

  async listCycles(actor: any) {
    return this.prisma.tontineCycle.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        code: true,
        status: true,
        fixedAmountXaf: true,
        installmentCount: true,
        totalCollectedXaf: true,
        branchId: true,
        createdAt: true,
      },
    });
  }

  async getCycleDetail(actor: any, cycleId: string) {
    const uuid = z.string().uuid();
    const parsed = uuid.safeParse(cycleId);
    if (!parsed.success) throw new BadRequestException('Identifiant de cycle invalide.');

    return this.prisma.tontineCycle.findUnique({
      where: { id: cycleId },
      select: {
        id: true,
        code: true,
        status: true,
        fixedAmountXaf: true,
        installmentCount: true,
        totalCollectedXaf: true,
        targetInstallments: true,
        branchId: true,
        createdAt: true,
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { eventType: true, createdAt: true, reason: true },
        },
      },
    });
  }

  async suspendCycle(actor: any, cycleId: string) {
    this.requireRole(actor, ['ADMIN', 'SUPERVISOR']);
    return this.cyclesService.changeCycleState(actor, cycleId, 'SUSPEND', {});
  }

  async resumeCycle(actor: any, cycleId: string) {
    this.requireRole(actor, ['ADMIN', 'SUPERVISOR']);
    return this.cyclesService.changeCycleState(actor, cycleId, 'RESUME', {});
  }

  private requireRole(actor: any, allowed: string[]) {
    if (!allowed.includes(actor.role)) {
      throw new Error('Action non autorisée pour ce rôle.');
    }
  }
}