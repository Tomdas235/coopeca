import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

export interface RemittanceFilters {
  status?: string | null;
  agentId?: string | null;
  branchId?: string | null;
  marketId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

/**
 * Validates that the actor has access to the specified branch.
 * Throws ForbiddenException if access is denied.
 */
function checkBranchAccess(actor: AuthenticatedPrincipal, branchId: string): void {
  if (actor.role !== 'ADMIN') {
    const hasAccess = actor.branches.some(({ id }) => id === branchId);
    if (!hasAccess) {
      throw new ForbiddenException('Accès refusé pour cette agence.');
    }
  }
}

/**
 * Generates a unique client operation ID for idempotent operations.
 */
function generateClientOperationId(): string {
  return randomUUID();
}

/**
 * Generates a remittance number in the format REM-YYYYMMDD-XXXXXX
 */
function generateRemittanceNo(): string {
  return `REM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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

/**
 * Creates a remittance with proper validation, audit logging, and transaction safety.
 */
@Injectable()
export class RemittancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    actor: AuthenticatedPrincipal,
    input: CreateRemittanceInput,
  ) {
    // ADMIN has access to all branches; non-ADMIN must have explicit branch access
    checkBranchAccess(actor, input.branchId);

    const clientOperationId = generateClientOperationId();
    const remittanceNo = generateRemittanceNo();

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
          requestId: generateClientOperationId(),
        },
      });

      return remittance;
    });
  }

  async findMany(
  actor: AuthenticatedPrincipal,
  filters: RemittanceFilters,
  page: number,
  limit: number,
) {
  if (!['AGENT', 'CASHIER', 'SUPERVISOR', 'ADMIN', 'ACCOUNTANT', 'AUDITOR'].includes(actor.role)) {
    throw new ForbiddenException('Consultation des remises non autorisée.');
  }

  const skip = (page - 1) * limit;
  const branchIds = actor.branches.map(({ id }) => id);

  if (branchIds.length === 0) {
    return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
  }

  // Build where clause incrementally for better type safety
  const where: Record<string, unknown> = { branchId: { in: branchIds } };

  // Agent role restricts to their own remittances
  if (actor.role === 'AGENT') {
    where.agentId = actor.id;
  }

  // Filter by status
  if (filters.status) {
    where.status = { equals: filters.status as RemittanceStatus };
  }

  // Filter by specific agentId
  if (filters.agentId) {
    where.agentId = { equals: filters.agentId };
  }

  // Filter by specific branchId (validates access)
  if (filters.branchId) {
    if (!branchIds.includes(filters.branchId)) {
      return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }
    where.branchId = { equals: filters.branchId };
  }

  // Filter by marketId via branch relation
  if (filters.marketId) {
    where.branch = { marketId: filters.marketId };
  }

  // Filter by date range
  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      (where.createdAt as { gte?: Date }).gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      (where.createdAt as { lte?: Date }).lte = new Date(filters.toDate);
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

  async findAll(
  actor: AuthenticatedPrincipal,
  params: {
    page: number;
    limit: number;
    status?: string;
    agentId?: string;
    branchId?: string;
    marketId?: string;
    fromDate?: string;
    toDate?: string;
  },
) {
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
  input: ReceiveRemittanceInput,
) {
  // Only CASHIER, SUPERVISOR, or ADMIN can confirm receipt
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

    // Non-ADMIN actors must have access to the remittance's branch
    checkBranchAccess(actor, remittance.branchId);

    // Only DRAFT or SUBMITTED remittances can be received
    if (remittance.status !== RemittanceStatus.DRAFT && remittance.status !== RemittanceStatus.SUBMITTED) {
      throw new BadRequestException('Cette remise ne peut plus être reçue.');
    }

    const previousStatus = remittance.status;

    const updated = await tx.remittance.update({
      where: { id },
      data: {
        status: RemittanceStatus.RECEIVED,
        receivedTotalXaf: input.receivedTotalXaf,
        receivedBy: actor.id,
        receivedAt: new Date(),
        cashierNote: input.cashierNote ?? null,
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

    // Create discrepancy if received amount differs from declared amount
    if (updated.receivedTotalXaf !== remittance.declaredTotalXaf) {
      await tx.discrepancy.create({
        data: {
          branchId: remittance.branchId,
          remittanceId: remittance.id,
          openedBy: actor.id,
          status: 'OPEN',
          expectedTotalXaf: remittance.declaredTotalXaf,
          actualTotalXaf: updated.receivedTotalXaf,
          differenceXaf: updated.receivedTotalXaf - remittance.declaredTotalXaf,
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
        afterData: {
          status: RemittanceStatus.RECEIVED,
          receivedTotalXaf: updated.receivedTotalXaf?.toString() ?? null,
        },
        requestId: generateClientOperationId(),
      },
    });

    return updated;
  });
}
  async declareDiscrepancy(
  actor: AuthenticatedPrincipal,
  id: string,
  input: DeclareDiscrepancyInput,
) {
  // Only CASHIER, SUPERVISOR, or ADMIN can declare discrepancies
  if (!['CASHIER', 'SUPERVISOR', 'ADMIN'].includes(actor.role)) {
    throw new ForbiddenException('Seul un caissier ou superviseur peut déclarer un écart.');
  }

  return this.prisma.$transaction(async (tx) => {
    // Fetch remittance within transaction to prevent race condition on discrepancy check
    const remittance = await tx.remittance.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!remittance) {
      throw new NotFoundException('Remise introuvable.');
    }

    // Non-ADMIN actors must have access to the remittance's branch
    checkBranchAccess(actor, remittance.branchId);

    // Check for existing open discrepancy inside the transaction
    const existingDiscrepancy = await tx.discrepancy.findFirst({
      where: { remittanceId: id, status: 'OPEN' },
    });

    if (existingDiscrepancy) {
      throw new ConflictException('Un écart est déjà ouvert pour cette remise.');
    }

    // Create the discrepancy record
    const discrepancy = await tx.discrepancy.create({
      data: {
        branchId: remittance.branchId,
        remittanceId: id,
        openedBy: actor.id,
        status: 'OPEN',
        expectedTotalXaf: remittance.declaredTotalXaf,
        actualTotalXaf: input.discrepancyAmountXaf,
        differenceXaf: input.discrepancyAmountXaf - remittance.declaredTotalXaf,
        description: input.discrepancyReason,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        opener: { select: { id: true, fullName: true } },
      },
    });

    // If the remittance was already received, mark it as DISPUTED
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
          actualTotalXaf: input.discrepancyAmountXaf.toString(),
          differenceXaf: discrepancy.differenceXaf?.toString() ?? null,
        },
        requestId: generateClientOperationId(),
      },
    });

    return discrepancy;
  });
}
}

