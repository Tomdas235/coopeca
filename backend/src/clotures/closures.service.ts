import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ClosureStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

type CreateClosureInput = {
  businessDate?: Date;
  declaredCollectionTotalXaf: bigint;
  declaredRemittanceTotalXaf: bigint;
  collectionCount: number;
  deviceId: string;
};

@Injectable()
export class ClosuresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    actor: AuthenticatedPrincipal,
    input: CreateClosureInput,
  ) {
    if (actor.role !== 'AGENT' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un agent peut déclarer une clôture journalière.');
    }

    const branchId = actor.branches.find((b) => b.isPrimary)?.id;
    if (!branchId) {
      throw new ForbiddenException('Aucune agence primaire définie pour cet utilisateur.');
    }

    const businessDate = input.businessDate ?? new Date();
    const closureNo = `CL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const clientOperationId = randomUUID();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.dailyClosure.findFirst({
        where: {
          agentId: actor.id,
          businessDate,
        },
      });

      if (existing) {
        throw new ConflictException('Une clôture existe déjà pour cette date et cet agent.');
      }

      const closure = await tx.dailyClosure.create({
        data: {
          branchId,
          agentId: actor.id,
          businessDate,
          closureNo,
          clientOperationId,
          declaredCollectionTotalXaf: input.declaredCollectionTotalXaf,
          declaredRemittanceTotalXaf: input.declaredRemittanceTotalXaf,
          collectionCount: input.collectionCount,
          status: ClosureStatus.DRAFT,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId,
          action: 'CLOSURE_DECLARED',
          entityType: 'daily_closures',
          entityId: closure.id,
          afterData: {
            closureNo: closure.closureNo,
            businessDate: closure.businessDate,
            declaredCollectionTotalXaf: closure.declaredCollectionTotalXaf.toString(),
            declaredRemittanceTotalXaf: closure.declaredRemittanceTotalXaf.toString(),
            status: closure.status,
          },
          requestId: randomUUID(),
        },
      });

      return closure;
    });
  }

  async list(
    actor: AuthenticatedPrincipal,
    params: {
      page: number;
      limit: number;
      branchId?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const where: Prisma.DailyClosureWhereInput = {};

    if (actor.role !== 'ADMIN') {
      const accessibleBranchIds = actor.branches.map((b) => b.id);
      where.branchId = { in: accessibleBranchIds };
      if (actor.role === 'AGENT') {
        where.agentId = actor.id;
      }
    } else if (params.branchId) {
      where.branchId = params.branchId;
    }

    if (params.status) {
      where.status = params.status as ClosureStatus;
    }

    if (params.fromDate || params.toDate) {
      where.businessDate = {};
      if (params.fromDate) {
        (where.businessDate as Record<string, unknown>).gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        (where.businessDate as Record<string, unknown>).lte = new Date(params.toDate);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.dailyClosure.findMany({
        where,
        orderBy: [{ businessDate: 'desc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          closureNo: true,
          businessDate: true,
          declaredCollectionTotalXaf: true,
          declaredRemittanceTotalXaf: true,
          collectionCount: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          createdAt: true,
          agent: { select: { id: true, fullName: true, username: true } },
          branch: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.dailyClosure.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        declaredCollectionTotalXaf: c.declaredCollectionTotalXaf.toString(),
        declaredRemittanceTotalXaf: c.declaredRemittanceTotalXaf.toString(),
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async review(
    actor: AuthenticatedPrincipal,
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reviewNote?: string,
  ) {
    if (!['SUPERVISOR', 'ADMIN'].includes(actor.role)) {
      throw new ForbiddenException('Seul un superviseur ou administrateur peut réviser une clôture.');
    }

    return this.prisma.$transaction(async (tx) => {
      const closure = await tx.dailyClosure.findUnique({
        where: { id },
        include: { branch: true },
      });

      if (!closure) {
        throw new NotFoundException('Clôture introuvable.');
      }

      if (closure.status !== ClosureStatus.DRAFT) {
        throw new BadRequestException('Cette clôture ne peut plus être révisée.');
      }

      if (actor.role !== 'ADMIN') {
        const hasAccess = actor.branches.some(({ id }) => id === closure.branchId);
        if (!hasAccess) {
          throw new ForbiddenException('Accès refusé pour cette agence.');
        }
      }

      const newStatus = decision === 'APPROVE' ? ClosureStatus.REVIEWED : ClosureStatus.REOPENED;

      const updated = await tx.dailyClosure.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
          reviewNote,
        },
        select: {
          id: true,
          closureNo: true,
          status: true,
          reviewedBy: true,
          reviewedAt: true,
          reviewNote: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: closure.branchId,
          action: decision === 'APPROVE' ? 'CLOSURE_APPROVED' : 'CLOSURE_REJECTED',
          entityType: 'daily_closures',
          entityId: id,
          beforeData: { status: closure.status },
          afterData: { status: newStatus, reviewNote },
          requestId: randomUUID(),
        },
      });

      return updated;
    });
  }

  async reopen(
    actor: AuthenticatedPrincipal,
    id: string,
    reason: string,
  ) {
    if (!['SUPERVISOR', 'ADMIN'].includes(actor.role)) {
      throw new ForbiddenException('Seul un superviseur ou administrateur peut rouvrir une clôture.');
    }

    return this.prisma.$transaction(async (tx) => {
      const closure = await tx.dailyClosure.findUnique({
        where: { id },
        include: { branch: true },
      });

      if (!closure) {
        throw new NotFoundException('Clôture introuvable.');
      }

      if (closure.status !== ClosureStatus.REVIEWED && closure.status !== ClosureStatus.REOPENED) {
        throw new BadRequestException('Seule une clôture révisée ou déjà rouverte peut être rouverte.');
      }

      if (actor.role !== 'ADMIN') {
        const hasAccess = actor.branches.some(({ id }) => id === closure.branchId);
        if (!hasAccess) {
          throw new ForbiddenException('Accès refusé pour cette agence.');
        }
      }

      const updated = await tx.dailyClosure.update({
        where: { id },
        data: {
          status: ClosureStatus.REOPENED,
          reopenCount: closure.reopenCount + 1,
        },
        select: {
          id: true,
          closureNo: true,
          status: true,
          reopenCount: true,
        },
      });

      await tx.closureReopenEvent.create({
        data: {
          closureId: id,
          branchId: closure.branchId,
          reopenedBy: actor.id,
          previousStatus: closure.status,
          reason,
          requestId: randomUUID(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: closure.branchId,
          action: 'CLOSURE_REOPENED',
          entityType: 'daily_closures',
          entityId: id,
          beforeData: { status: closure.status, reopenCount: closure.reopenCount },
          afterData: { status: ClosureStatus.REOPENED, reopenCount: updated.reopenCount },
          requestId: randomUUID(),
        },
      });

      return updated;
    });
  }

}