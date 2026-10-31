import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { RemittanceStatus } from "@prisma/client";
import { AuthenticatedPrincipal } from "../auth/auth.types";

export interface RemittanceFilters {
  status?: string | null;
  agentId?: string | null;
  branchId?: string | null;
  marketId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

@Injectable()
export class RemittancesService {
  constructor(private readonly prisma: PrismaService) {}

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
        orderBy: { createdAt: "desc" },
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

  async create(_actor: { id: string }, input: { agentId: string; branchId: string; marketId: string; periodStart: string; periodEnd: string; declaredAmountXaf: string; description?: string }) {
    const declaredTotalXaf = BigInt(input.declaredAmountXaf);

    return this.prisma.remittance.create({
      data: {
        branchId: input.branchId,
        agentId: input.agentId,
        remittanceNo: `REM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        status: RemittanceStatus.DRAFT,
        declaredTotalXaf,
        clientOperationId: input.marketId,
        cashierNote: input.description,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        agent: { select: { id: true, fullName: true } },
      },
    });
  }
}


