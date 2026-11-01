import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RemittanceStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

type TransactionClient = Prisma.TransactionClient;

export interface RemittanceFilters {
  status?: string | null;
  agentId?: string | null;
  branchId?: string | null;
  marketId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

type CreateRemittanceInput = {
  branchId: string;
  declaredAmountXaf: bigint;
  description?: string | null;
};

type ReceiveRemittanceInput = {
  receivedTotalXaf: bigint;
  cashierNote?: string | null;
};

type DeclareDiscrepancyInput = {
  discrepancyAmountXaf: bigint;
  discrepancyReason: string;
};

@Injectable()
export class RemittancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    actor: AuthenticatedPrincipal,
    input: CreateRemittanceInput,
  ) {
    if (actor.role !== 'ADMIN') {
      const hasAccess = actor.branches.some(({ id }) => id === input.branchId);
      if (!hasAccess) {
        throw new ForbiddenException('Accès refusé pour cette agence.');
      }
    }

    const clientOperationId = randomUUID();
    const remittanceNo = `REM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const remittance = await tx.remittance.create({
        data: {
          branchId: input.branchId,
          agentId: actor.id,
          remittanceNo,
          status: RemittanceStatus.DRAFT,
          declaredTotalXaf: input.declaredAmountXaf,
          clientOperationId,
          cashierNote: input.description ?? null,
        },
        include: {
          branch: { select: { id: true, code: true, name: true } },
          agent: { select: { id: true, fullName: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: input.branchId,
          action: 'REMITTANCE_DECLARED',
          entityType: 'remittances',
          entityId: remittance.id,
          afterData: {
            remittanceNo: remittance.remittanceNo,
            declaredTotalXaf: remittance.declaredTotalXaf.toString(),
            status: remittance.status,
          },
          requestId: randomUUID(),
        },
      });

      return remittance;
    });
  }

  async findMany(actor: AuthenticatedPrincipal, filters: RemittanceFilters, page: number, limit: number) {
    if (!['AGENT', 'CASHIER', 'SUPERVISOR', 'ADMIN', 'ACCOUNTANT', 'AUDITOR'].includes(actor.role)) {
      throw new ForbiddenException('Consultation des remises non autorisée.');
    }
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    const branchIds = actor.branches.map(({ id }) => id);
    if (branchIds.length === 0) return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
    where.branchId = { in: branchIds };
    if (actor.role === 'AGENT') where.agentId = actor.id;

    if (filters.status) {
      where.status = { equals: filters.status as RemittanceStatus };
    }
    if (filters.agentId) {
      where.agentId = { equals: filters.agentId };
    }
    if (filters.branchId) {
      if (!branchIds.includes(filters.branchId)) {
        return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.branchId = { equals: filters.branchId };
    }
    if (filters.marketId) {
      where.branch = { marketId: filters.marketId };
    }
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.toDate);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.remittance.findMany({
        where,
        skip,
        take: limit,
        include: {
          branch: { select: { id: true, code: true, name: true, marketId: true } },
          agent: { select: { id: true, fullName: true } },
          cashier: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.remittance.count({ where }),
    ]);

    return {
      items: data.map((item) => ({
        ...item,
        declaredTotalXaf: item.declaredTotalXaf.toString(),
        receivedTotalXaf: item.receivedTotalXaf?.toString() ?? null,
        marketId: item.branch.marketId,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(actor: AuthenticatedPrincipal, params: { page: number; limit: number; status?: string; agentId?: string; branchId?: string; marketId?: string; fromDate?: string; toDate?: string }) {
    return this.findMany(
      actor,
      {
        status: params.status ?? null,
        agentId: params.agentId ?? null,
        branchId: params.branchId ?? null,
        marketId: params.marketId ?? null,
        fromDate: params.fromDate ?? null,
        toDate: params.toDate ?? null,
      },
      params.page,
      params.limit,
    );
  }

  async receive(
    actor: AuthenticatedPrincipal,
    id: string,
    receivedTotalXaf: bigint,
    cashierNote?: string | null,
  ) {
    if (!['CASHIER', 'SUPERVISOR', 'ADMIN'].includes(actor.role)) {
      throw new ForbiddenException('Seul un caissier ou superviseur peut confirmer la réception d\'une remise.');
    }

    return this.prisma.$transaction(async (tx) => {
      const remittance = await tx.remittance.findUnique({
        where: { id },
        include: { branch: true, agent: true },
      });

      if (!remittance) {
        throw new NotFoundException('Remise introuvable.');
      }

      if (remittance.status !== RemittanceStatus.DRAFT && remittance.status !== RemittanceStatus.SUBMITTED) {
        throw new BadRequestException('Cette remise ne peut plus être reçue.');
      }

      if (actor.role !== 'ADMIN') {
        const hasAccess = actor.branches.some(({ id }) => id === remittance.branchId);
        if (!hasAccess) {
          throw new ForbiddenException('Accès refusé pour cette agence.');
        }
      }

      const previousStatus = remittance.status;
      const updated = await tx.remittance.update({
        where: { id },
        data: {
          status: RemittanceStatus.RECEIVED,
          receivedTotalXaf,
          receivedBy: actor.id,
          receivedAt: new Date(),
          cashierNote: cashierNote ?? null,
        },
        select: {
          id: true,
          remittanceNo: true,
          status: true,
          declaredTotalXaf: true,
          receivedTotalXaf: true,
          receivedBy: true,
          receivedAt: true,
        },
      });

      if (receivedTotalXaf !== remittance.declaredTotalXaf) {
        await tx.discrepancy.create({
          data: {
            branchId: remittance.branchId,
            remittanceId: remittance.id,
            openedBy: actor.id,
            status: 'OPEN',
            expectedTotalXaf: remittance.declaredTotalXaf,
            actualTotalXaf: receivedTotalXaf,
            differenceXaf: receivedTotalXaf - remittance.declaredTotalXaf,
            description: 'Écart entre montant déclaré et montant reçu lors de la confirmation caisse.',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: remittance.branchId,
          action: 'REMITTANCE_RECEIVED',
          entityType: 'remittances',
          entityId: id,
          beforeData: { status: previousStatus },
          afterData: { status: RemittanceStatus.RECEIVED, receivedTotalXaf: updated.receivedTotalXaf?.toString() ?? null },
          requestId: randomUUID(),
        },
      });

      return updated;
    });
  }
  async declareDiscrepancy(
    actor: AuthenticatedPrincipal,
    id: string,
    discrepancyAmountXaf: bigint,
    discrepancyReason: string,
  ) {
    if (!['CASHIER', 'SUPERVISOR', 'ADMIN'].includes(actor.role)) {
      throw new ForbiddenException('Seul un caissier ou superviseur peut déclarer un écart.');
    }

    const remittance = await this.prisma.remittance.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!remittance) {
      throw new NotFoundException('Remise introuvable.');
    }

    if (actor.role !== 'ADMIN') {
      const hasAccess = actor.branches.some(({ id }) => id === remittance.branchId);
      if (!hasAccess) {
        throw new ForbiddenException('Accès refusé pour cette agence.');
      }
    }

    const existingDiscrepancy = await this.prisma.discrepancy.findFirst({
      where: { remittanceId: id, status: 'OPEN' },
    });

    if (existingDiscrepancy) {
      throw new ConflictException('Un écart est déjà ouvert pour cette remise.');
    }

    return this.prisma.$transaction(async (tx) => {
      const discrepancy = await tx.discrepancy.create({
        data: {
          branchId: remittance.branchId,
          remittanceId: id,
          openedBy: actor.id,
          status: 'OPEN',
          expectedTotalXaf: remittance.declaredTotalXaf,
          actualTotalXaf: discrepancyAmountXaf,
          differenceXaf: discrepancyAmountXaf - remittance.declaredTotalXaf,
          description: discrepancyReason,
        },
        include: {
          branch: { select: { id: true, code: true, name: true } },
          opener: { select: { id: true, fullName: true } },
        },
      });

      if (remittance.status === RemittanceStatus.RECEIVED) {
        await tx.remittance.update({
          where: { id },
          data: { status: RemittanceStatus.DISPUTED },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: remittance.branchId,
          action: 'DISCREPANCY_DECLARED',
          entityType: 'discrepancies',
          entityId: discrepancy.id,
          afterData: {
            remittanceId: id,
            expectedTotalXaf: remittance.declaredTotalXaf.toString(),
            actualTotalXaf: discrepancyAmountXaf.toString(),
            differenceXaf: discrepancy.differenceXaf?.toString() ?? null,
          },
          requestId: randomUUID(),
        },
      });

      return discrepancy;
    });
  }



