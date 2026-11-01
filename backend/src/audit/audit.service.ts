import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, AuditAction } from '@prisma/client';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    actor: AuthenticatedPrincipal,
    params: {
      page: number;
      limit: number;
      action?: string;
      entityType?: string;
      entityId?: string;
      branchId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    // Seuls ADMIN et AUDITOR ont accès à la traçabilité complète
    if (actor.role !== 'ADMIN' && actor.role !== 'AUDITOR') {
      throw new ForbiddenException('Accès audit réservé aux rôles ADMIN et AUDITOR.');
    }

    const where: Prisma.AuditLogWhereInput = {};

    if (params.action) {
      where.action = params.action as AuditAction;
    }
    if (params.entityType) {
      where.entityType = params.entityType;
    }
    if (params.entityId) {
      where.entityId = params.entityId;
    }
    if (params.branchId) {
      where.branchId = params.branchId;
    }
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(params.toDate);
      }
    }

    if (actor.role !== 'ADMIN') {
      const accessibleBranchIds = actor.branches.map((b) => b.id);
      if (accessibleBranchIds.length > 0) {
        where.branchId = { in: accessibleBranchIds };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          actorUserId: true,
          branchId: true,
          action: true,
          entityType: true,
          entityId: true,
          beforeData: true,
          afterData: true,
          requestId: true,
          createdAt: true,
          actor: {
            select: { id: true, fullName: true, username: true, role: true },
          },
          branch: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}