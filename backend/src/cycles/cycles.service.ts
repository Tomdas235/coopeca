import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import {
  calculateAvailableBalance,
  calculateWithdrawal,
  CycleRuleError,
  recordDeposit,
  resumeCycle,
  suspendCycle,
  validateCycleOpening,
} from './cycle.domain';

type TransactionClient = Prisma.TransactionClient;

type OpenCycleInput = {
  fixedAmountXaf: bigint;
  clientOperationId: string;
};

type DepositInput = {
  amountXaf: bigint;
  idempotencyKey: string;
  declaredAt?: Date;
};

type WithdrawalInput = {
  amountXaf: bigint;
  closesCycle: boolean;
  idempotencyKey: string;
  reason?: string;
};

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMarkets() {
    return this.prisma.market.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, code: true, name: true },
    });
  }

  async createMarket(
    actor: AuthenticatedPrincipal,
    input: { code: string; name: string },
  ) {
    this.requireRole(actor, ['ADMIN', 'SUPERVISOR']);
    try {
      return await this.serializableTransaction(async (tx) => {
        const market = await tx.market.create({
          data: { code: input.code, name: input.name },
          select: { id: true, code: true, name: true, isActive: true, createdAt: true },
        });
        await this.writeAudit(tx, actor.id, null, 'MARKET_CREATED', 'markets', market.id, {
          code: market.code,
          name: market.name,
        }, randomUUID());
        return market;
      });
    } catch (error) {
      if (this.isPrismaCode(error, 'P2002')) {
        throw new ConflictException({ code: 'MARCHE_CODE_DEJA_UTILISE', message: 'Ce code marché existe déjà.' });
      }
      throw error;
    }
  }

  async setMarketActive(actor: AuthenticatedPrincipal, marketId: string, isActive: boolean) {
    this.requireRole(actor, ['ADMIN', 'SUPERVISOR']);
    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    if (!market) throw new NotFoundException('Marché introuvable.');
    return this.serializableTransaction(async (tx) => {
      const updated = await tx.market.update({
        where: { id: marketId },
        data: { isActive, updatedAt: new Date() },
        select: { id: true, code: true, name: true, isActive: true, updatedAt: true },
      });
      await this.writeAudit(tx, actor.id, null, 'MARKET_ACTIVE_CHANGED', 'markets', marketId, {
        isActive,
      }, randomUUID());
      return updated;
    });
  }

  async assignClientToCycleProduct(
    actor: AuthenticatedPrincipal,
    clientId: string,
    input: { marketId: string; collectionAgentId: string },
  ) {
    this.requireRole(actor, ['ADMIN', 'SUPERVISOR']);
    return this.serializableTransaction(async (tx) => {
      const client = await tx.client.findUnique({ where: { id: clientId } });
      if (!client) throw new NotFoundException('Client introuvable.');
      this.assertBranchAccess(actor, client.branchId);
      const openCycleCount = await tx.tontineCycle.count({
        where: { clientId, status: { not: 'CLOSED' } },
      });
      if (openCycleCount > 0) {
        throw new ConflictException({
          code: 'CLIENT_CYCLE_EN_COURS',
          message: 'L’affectation marché/agent ne peut pas changer pendant un cycle non clôturé.',
        });
      }
      const market = await tx.market.findUnique({ where: { id: input.marketId } });
      if (!market?.isActive) throw new BadRequestException('Le marché doit être actif.');
      const agent = await tx.appUser.findUnique({
        where: { id: input.collectionAgentId },
        select: { id: true, role: true, isActive: true },
      });
      if (!agent || !agent.isActive || agent.role !== 'AGENT') {
        throw new BadRequestException('L’agent collecteur doit être un compte AGENT actif.');
      }
      const updated = await tx.client.update({
        where: { id: clientId },
        data: { marketId: market.id, collectionAgentId: agent.id },
        select: { id: true, clientCode: true, branchId: true, marketId: true, collectionAgentId: true },
      });
      await this.writeAudit(tx, actor.id, client.branchId, 'CLIENT_CYCLE_ASSIGNMENT_CHANGED', 'clients', clientId, {
        marketId: market.id,
        collectionAgentId: agent.id,
      }, randomUUID());
      return updated;
    });
  }

  async openCycle(
    actor: AuthenticatedPrincipal,
    dossierId: string,
    input: OpenCycleInput,
  ) {
    this.requireRole(actor, ['AGENT']);
    this.mapDomainError(() => validateCycleOpening(input.fixedAmountXaf));
    const payloadHash = this.hashPayload({
      dossierId,
      fixedAmountXaf: input.fixedAmountXaf.toString(),
    });

    try {
      return await this.serializableTransaction(async (tx) => {
        const existing = await tx.tontineCycle.findUnique({
          where: { clientOperationId: input.clientOperationId },
          include: { transactions: true },
        });
        if (existing) {
          if (existing.payloadHash !== payloadHash) {
            throw new ConflictException({
              code: 'IDEMPOTENCY_PAYLOAD_MISMATCH',
              message: 'Cette clé a déjà été utilisée avec un contenu différent.',
            });
          }
          return this.serializeCycle(existing, existing.transactions);
        }

        const dossier = await tx.dossier.findUnique({
          where: { id: dossierId },
          include: { client: true },
        });
        if (!dossier || dossier.status !== 'OPEN') {
          throw new NotFoundException('Dossier ouvert introuvable.');
        }
        this.assertBranchAccess(actor, dossier.client.branchId);
        const client = dossier.client;
        if (client.status !== 'ACTIVE' || !client.marketId || !client.collectionAgentId) {
          throw new ConflictException({
            code: 'CLIENT_CYCLE_NON_PRET',
            message: 'Le client doit être confirmé, rattaché à un marché et affecté à un agent.',
          });
        }
        if (client.collectionAgentId !== actor.id) {
          throw new ForbiddenException('Ce client n’est pas affecté à votre portefeuille.');
        }

        const market = await tx.market.findUnique({ where: { id: client.marketId } });
        if (!market?.isActive) {
          throw new ConflictException({ code: 'MARCHE_INACTIF', message: 'Le marché du client est inactif.' });
        }

        const created = await tx.tontineCycle.create({
          data: {
            dossierId,
            clientId: client.id,
            marketId: market.id,
            branchId: client.branchId,
            openedByAgentId: actor.id,
            fixedAmountXaf: input.fixedAmountXaf,
            clientOperationId: input.clientOperationId,
            payloadHash,
            events: {
              create: {
                actorUserId: actor.id,
                eventType: 'OPENED',
                requestId: input.clientOperationId,
              },
            },
          },
        });
        await this.writeAudit(tx, actor.id, client.branchId, 'TONTINE_CYCLE_OPENED', 'tontine_cycles', created.id, {
          fixedAmountXaf: input.fixedAmountXaf.toString(),
          dossierId,
          marketId: market.id,
        }, input.clientOperationId);
        return this.serializeCycle(created, []);
      });
    } catch (error) {
      if (this.isPrismaCode(error, 'P2002')) {
        const replay = await this.prisma.tontineCycle.findUnique({
          where: { clientOperationId: input.clientOperationId },
          include: { transactions: true },
        });
        if (replay) {
          if (replay.payloadHash !== payloadHash) {
            throw new ConflictException({ code: 'IDEMPOTENCY_PAYLOAD_MISMATCH', message: 'La clé de cycle existe avec un contenu différent.' });
          }
          return this.serializeCycle(replay, replay.transactions);
        }
        throw new ConflictException({ code: 'CYCLE_OUVERT_EXISTANT', message: 'Un cycle non clôturé existe déjà pour ce dossier.' });
      }
      throw error;
    }
  }

  async getCycle(actor: AuthenticatedPrincipal, cycleId: string) {
    const cycle = await this.prisma.tontineCycle.findUnique({
      where: { id: cycleId },
      include: {
        client: { select: { collectionAgentId: true } },
        transactions: { orderBy: { occurredAt: 'asc' } },
        commission: true,
      },
    });
    if (!cycle) throw new NotFoundException('Cycle introuvable.');
    this.assertCanReadCycle(actor, cycle.client.collectionAgentId, cycle.branchId);
    const balance = calculateAvailableBalance(cycle.transactions);
    return this.serializeCycle(cycle, cycle.transactions, balance, cycle.commission !== null);
  }

  async listDossierCycles(actor: AuthenticatedPrincipal, dossierId: string) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
      include: { client: { select: { collectionAgentId: true, branchId: true } } },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable.');
    this.assertCanReadCycle(actor, dossier.client.collectionAgentId, dossier.client.branchId);
    const cycles = await this.prisma.tontineCycle.findMany({
      where: { dossierId },
      include: { transactions: true, commission: true },
      orderBy: { openedAt: 'desc' },
    });
    return cycles.map((cycle) => this.serializeCycle(
      cycle,
      cycle.transactions,
      calculateAvailableBalance(cycle.transactions),
      cycle.commission !== null,
    ));
  }

  async listPendingWithdrawals(actor: AuthenticatedPrincipal) {
    this.requireRole(actor, ['SUPERVISOR']);
    const branchIds = actor.branches.map(({ id }) => id);
    if (branchIds.length === 0) throw new ForbiddenException('Aucune agence n’est attribuée à ce superviseur.');
    const requests = await this.prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING', cycle: { branchId: { in: branchIds } } },
      include: {
        cycle: { include: { client: { select: { clientCode: true, firstName: true, lastName: true } } } },
        requester: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { requestedAt: 'asc' },
    });
    return requests.map((request) => ({
      id: request.id,
      cycleId: request.cycleId,
      client: request.cycle.client,
      requestedBy: request.requester,
      amountXaf: request.amountXaf.toString(),
      closesCycle: request.closesCycle,
      reason: request.reason,
      requestedAt: request.requestedAt,
    }));
  }

  async deposit(actor: AuthenticatedPrincipal, cycleId: string, input: DepositInput) {
    this.requireRole(actor, ['AGENT']);
    const payloadHash = this.hashPayload({
      cycleId,
      amountXaf: input.amountXaf.toString(),
      declaredAt: input.declaredAt?.toISOString() ?? null,
    });
    return this.serializableTransaction(async (tx) => {
      await this.lockCycle(tx, cycleId);
      const cycle = await tx.tontineCycle.findUnique({
        where: { id: cycleId },
        include: { client: { select: { collectionAgentId: true, branchId: true } } },
      });
      if (!cycle) throw new NotFoundException('Cycle introuvable.');
      this.assertAssignedAgent(actor, cycle.client.collectionAgentId);
      this.assertBranchAccess(actor, cycle.client.branchId);

      const existing = await tx.cycleTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        if (existing.payloadHash !== payloadHash || existing.type !== 'DEPOSIT' || existing.cycleId !== cycleId) {
          throw new ConflictException({ code: 'IDEMPOTENCY_PAYLOAD_MISMATCH', message: 'La clé de versement a déjà été utilisée.' });
        }
        return { transactionId: existing.id, replayed: true, cycleId };
      }

      this.mapDomainError(() => recordDeposit(cycle, input.amountXaf));
      const entry = await tx.cycleTransaction.create({
        data: {
          cycleId,
          type: 'DEPOSIT',
          amountXaf: input.amountXaf,
          actorUserId: actor.id,
          idempotencyKey: input.idempotencyKey,
          payloadHash,
          clientOccurredAt: input.declaredAt,
        },
      });
      await this.writeAudit(tx, actor.id, cycle.branchId, 'TONTINE_DEPOSIT_ACCEPTED', 'cycle_transactions', entry.id, {
        cycleId,
        amountXaf: input.amountXaf.toString(),
        clientOccurredAt: input.declaredAt?.toISOString() ?? null,
      }, input.idempotencyKey);
      return { transactionId: entry.id, replayed: false, cycleId };
    });
  }

  async changeCycleState(
    actor: AuthenticatedPrincipal,
    cycleId: string,
    action: 'SUSPEND' | 'RESUME',
    input: { requestId: string; reason?: string },
  ) {
    this.requireRole(actor, ['AGENT']);
    const eventType = action === 'SUSPEND' ? 'SUSPENDED' : 'RESUMED';
    return this.serializableTransaction(async (tx) => {
      await this.lockCycle(tx, cycleId);
      const cycle = await tx.tontineCycle.findUnique({
        where: { id: cycleId },
        include: { client: { select: { collectionAgentId: true } } },
      });
      if (!cycle) throw new NotFoundException('Cycle introuvable.');
      this.assertAssignedAgent(actor, cycle.client.collectionAgentId);

      const previous = await tx.tontineCycleEvent.findUnique({ where: { requestId: input.requestId } });
      if (previous) {
        if (previous.cycleId !== cycleId || previous.eventType !== eventType || previous.reason !== (input.reason ?? null)) {
          throw new ConflictException({ code: 'IDEMPOTENCY_PAYLOAD_MISMATCH', message: 'Cette clé de transition est déjà utilisée.' });
        }
        return { cycleId, status: cycle.status, replayed: true };
      }

      const status = this.mapDomainError(() => action === 'SUSPEND'
        ? suspendCycle(cycle)
        : resumeCycle(cycle));
      await tx.tontineCycle.update({
        where: { id: cycleId },
        data: { status, version: { increment: 1 } },
      });
      await tx.tontineCycleEvent.create({
        data: { cycleId, actorUserId: actor.id, eventType, reason: input.reason ?? null, requestId: input.requestId },
      });
      await this.writeAudit(tx, actor.id, cycle.branchId, `TONTINE_CYCLE_${eventType}`, 'tontine_cycles', cycleId, {
        previousStatus: cycle.status,
        status,
        reason: input.reason ?? null,
      }, input.requestId);
      return { cycleId, status, replayed: false };
    });
  }

  async requestWithdrawal(actor: AuthenticatedPrincipal, cycleId: string, input: WithdrawalInput) {
    this.requireRole(actor, ['AGENT']);
    const payloadHash = this.hashPayload({
      cycleId,
      amountXaf: input.amountXaf.toString(),
      closesCycle: input.closesCycle,
      reason: input.reason ?? null,
    });
    return this.serializableTransaction(async (tx) => {
      await this.lockCycle(tx, cycleId);
      const cycle = await tx.tontineCycle.findUnique({
        where: { id: cycleId },
        include: { client: { select: { collectionAgentId: true } }, transactions: true, commission: true },
      });
      if (!cycle) throw new NotFoundException('Cycle introuvable.');
      this.assertAssignedAgent(actor, cycle.client.collectionAgentId);

      const existing = await tx.withdrawalRequest.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        if (existing.payloadHash !== payloadHash || existing.cycleId !== cycleId) {
          throw new ConflictException({ code: 'IDEMPOTENCY_PAYLOAD_MISMATCH', message: 'La clé de retrait a déjà été utilisée.' });
        }
        return { withdrawalRequestId: existing.id, status: existing.status, replayed: true };
      }

      this.mapDomainError(() => calculateWithdrawal(
        cycle,
        calculateAvailableBalance(cycle.transactions),
        cycle.commission !== null,
        input.amountXaf,
        input.closesCycle,
      ));
      const request = await tx.withdrawalRequest.create({
        data: {
          cycleId,
          requestedByAgentId: actor.id,
          amountXaf: input.amountXaf,
          closesCycle: input.closesCycle,
          reason: input.reason ?? null,
          idempotencyKey: input.idempotencyKey,
          payloadHash,
        },
      });
      await tx.tontineCycleEvent.create({
        data: {
          cycleId,
          actorUserId: actor.id,
          eventType: 'WITHDRAWAL_REQUESTED',
          reason: input.reason ?? null,
          requestId: input.idempotencyKey,
        },
      });
      await this.writeAudit(tx, actor.id, cycle.branchId, 'TONTINE_WITHDRAWAL_REQUESTED', 'withdrawal_requests', request.id, {
        cycleId,
        amountXaf: input.amountXaf.toString(),
        closesCycle: input.closesCycle,
      }, input.idempotencyKey);
      return { withdrawalRequestId: request.id, status: request.status, replayed: false };
    });
  }

  async reviewWithdrawal(
    actor: AuthenticatedPrincipal,
    withdrawalRequestId: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string,
  ) {
    this.requireRole(actor, ['SUPERVISOR']);
    if (decision === 'REJECT' && !reason?.trim()) {
      throw new BadRequestException({ code: 'MOTIF_REQUIS', message: 'Un motif est requis pour rejeter le retrait.' });
    }
    return this.serializableTransaction(async (tx) => {
      const initial = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalRequestId } });
      if (!initial) throw new NotFoundException('Demande de retrait introuvable.');
      await this.lockCycle(tx, initial.cycleId);
      const request = await tx.withdrawalRequest.findUnique({
        where: { id: withdrawalRequestId },
        include: { cycle: { include: { transactions: true, commission: true } } },
      });
      if (!request) throw new NotFoundException('Demande de retrait introuvable.');
      this.assertBranchAccess(actor, request.cycle.branchId);
      if (request.status !== 'PENDING') {
        if (decision === 'APPROVE' && request.status === 'APPROVED') {
          return { withdrawalRequestId, status: request.status, transactionId: request.transactionId, replayed: true };
        }
        if (decision === 'REJECT' && request.status === 'REJECTED') {
          return { withdrawalRequestId, status: request.status, transactionId: null, replayed: true };
        }
        throw new ConflictException({ code: 'WITHDRAWAL_ALREADY_REVIEWED', message: 'La demande a déjà été traitée.' });
      }

      if (decision === 'REJECT') {
        const reviewed = await tx.withdrawalRequest.update({
          where: { id: withdrawalRequestId },
          data: { status: 'REJECTED', reviewedById: actor.id, reviewedAt: new Date(), rejectionReason: reason },
        });
        await tx.tontineCycleEvent.create({
          data: {
            cycleId: request.cycleId,
            actorUserId: actor.id,
            eventType: 'WITHDRAWAL_REJECTED',
            reason: reason ?? null,
            requestId: randomUUID(),
          },
        });
        await this.writeAudit(tx, actor.id, request.cycle.branchId, 'TONTINE_WITHDRAWAL_REJECTED', 'withdrawal_requests', request.id, {
          reason: reason ?? null,
        }, randomUUID());
        return { withdrawalRequestId: reviewed.id, status: reviewed.status, transactionId: null, replayed: false };
      }

      const balance = calculateAvailableBalance(request.cycle.transactions);
      const calculation = this.mapDomainError(() => calculateWithdrawal(
        request.cycle,
        balance,
        request.cycle.commission !== null,
        request.amountXaf,
        request.closesCycle,
      ));
      if (calculation.commissionToChargeXaf > 0n) {
        const commissionEntry = await tx.cycleTransaction.create({
          data: {
            cycleId: request.cycleId,
            type: 'COMMISSION',
            amountXaf: calculation.commissionToChargeXaf,
            actorUserId: actor.id,
            withdrawalRequestId,
            idempotencyKey: randomUUID(),
            payloadHash: this.hashPayload({ cycleId: request.cycleId, withdrawalRequestId, type: 'COMMISSION' }),
          },
        });
        await tx.cycleCommission.create({
          data: {
            cycleId: request.cycleId,
            branchId: request.cycle.branchId,
            amountXaf: calculation.commissionToChargeXaf,
            transactionId: commissionEntry.id,
            withdrawalRequestId,
            chargedById: actor.id,
          },
        });
      }

      const withdrawalEntry = await tx.cycleTransaction.create({
        data: {
          cycleId: request.cycleId,
          type: 'WITHDRAWAL',
          amountXaf: request.amountXaf,
          actorUserId: actor.id,
          withdrawalRequestId,
          idempotencyKey: request.idempotencyKey,
          payloadHash: request.payloadHash,
        },
      });
      await tx.withdrawalRequest.update({
        where: { id: withdrawalRequestId },
        data: {
          status: 'APPROVED',
          reviewedById: actor.id,
          reviewedAt: new Date(),
          transactionId: withdrawalEntry.id,
        },
      });
      const closesCycle = request.closesCycle || calculation.remainingBalanceXaf === 0n;
      if (closesCycle) {
        await tx.tontineCycle.update({
          where: { id: request.cycleId },
          data: { status: 'CLOSED', closedAt: new Date(), version: { increment: 1 } },
        });
        await tx.tontineCycleEvent.create({
          data: { cycleId: request.cycleId, actorUserId: actor.id, eventType: 'CLOSED', reason: request.reason, requestId: randomUUID() },
        });
      }
      await tx.tontineCycleEvent.create({
        data: {
          cycleId: request.cycleId,
          actorUserId: actor.id,
          eventType: 'WITHDRAWAL_APPROVED',
          reason: request.reason,
          requestId: randomUUID(),
        },
      });
      await this.writeAudit(tx, actor.id, request.cycle.branchId, 'TONTINE_WITHDRAWAL_APPROVED', 'withdrawal_requests', request.id, {
        amountXaf: request.amountXaf.toString(),
        commissionXaf: calculation.commissionToChargeXaf.toString(),
        remainingBalanceXaf: calculation.remainingBalanceXaf.toString(),
        closesCycle,
      }, randomUUID());
      return {
        withdrawalRequestId,
        status: 'APPROVED' as const,
        transactionId: withdrawalEntry.id,
        commissionXaf: calculation.commissionToChargeXaf.toString(),
        remainingBalanceXaf: calculation.remainingBalanceXaf.toString(),
        replayed: false,
      };
    });
  }

  private async lockCycle(tx: TransactionClient, cycleId: string): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM tontine_cycles WHERE id = ${cycleId}::uuid FOR UPDATE
    `;
    if (rows.length === 0) throw new NotFoundException('Cycle introuvable.');
  }

  private async serializableTransaction<T>(
    operation: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (!this.isPrismaCode(error, 'P2034') || attempt === 2) {
          if (this.isPrismaCode(error, 'P2034')) {
            throw new ConflictException({
              code: 'CONCURRENCY_RETRY_EXHAUSTED',
              message: 'L’opération est concurrente ; réessayez avec la même clé idempotente.',
            });
          }
          throw error;
        }
      }
    }
    throw new ConflictException({
      code: 'CONCURRENCY_RETRY_EXHAUSTED',
      message: 'L’opération est concurrente ; réessayez avec la même clé idempotente.',
    });
  }

  private async writeAudit(
    tx: TransactionClient,
    actorUserId: string,
    branchId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    afterData: Record<string, string | number | boolean | null>,
    requestId: string,
  ): Promise<void> {
    await tx.auditLog.create({
      data: { actorUserId, branchId, action, entityType, entityId, afterData, requestId },
    });
  }

  private assertCanReadCycle(
    actor: AuthenticatedPrincipal,
    assignedAgentId: string | null,
    branchId: string,
  ): void {
    if (actor.role === 'AGENT') this.assertAssignedAgent(actor, assignedAgentId);
    else this.requireRole(actor, ['ADMIN', 'SUPERVISOR', 'ACCOUNTANT', 'AUDITOR']);
    this.assertBranchAccess(actor, branchId);
  }

  private assertAssignedAgent(actor: AuthenticatedPrincipal, assignedAgentId: string | null): void {
    if (!assignedAgentId || actor.id !== assignedAgentId) {
      throw new ForbiddenException('Ce client n’est pas affecté à votre portefeuille.');
    }
  }

  private assertBranchAccess(actor: AuthenticatedPrincipal, branchId: string): void {
    if (!actor.branches.some(({ id }) => id === branchId)) {
      throw new ForbiddenException('Accès refusé pour cette agence.');
    }
  }

  private requireRole(actor: AuthenticatedPrincipal, allowed: string[]): void {
    if (!allowed.includes(actor.role)) throw new ForbiddenException('Action non autorisée pour ce rôle.');
  }

  private hashPayload(payload: Record<string, string | boolean | null>): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private mapDomainError<T>(operation: () => T): T {
    try {
      return operation();
    } catch (error) {
      if (error instanceof CycleRuleError) {
        throw new BadRequestException({ code: error.code, message: error.message });
      }
      throw error;
    }
  }

  private isPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
  }

  private serializeCycle(
    cycle: { id: string; status: string; fixedAmountXaf: bigint; installmentCount: number; totalCollectedXaf: bigint },
    transactions: readonly { type: 'DEPOSIT' | 'COMMISSION' | 'WITHDRAWAL'; amountXaf: bigint }[],
    balanceXaf = calculateAvailableBalance(transactions),
    commissionPaid = transactions.some(({ type }) => type === 'COMMISSION'),
  ) {
    return {
      id: cycle.id,
      status: cycle.status,
      fixedAmountXaf: cycle.fixedAmountXaf.toString(),
      installmentCount: cycle.installmentCount,
      totalCollectedXaf: cycle.totalCollectedXaf.toString(),
      targetInstallments: 31,
      availableBalanceXaf: balanceXaf.toString(),
      commissionPaid,
    };
  }
}