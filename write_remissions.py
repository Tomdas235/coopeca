# -*- coding: utf-8 -*-
import os

content = '''import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedPrincipal } from '../auth/auth.types';

export type PageOptions = {
  page?: number;
  limit?: number;
};

export type RemittanceFilters = {
  status?: string;
  agentId?: string;
  branchId?: string;
  marketId?: string;
  fromDate?: Date;
  toDate?: Date;
};

export interface RemittanceListItem {
  id: string;
  agent: { id: string; username: string; fullName: string };
  branch: { id: string; code: string; name: string };
  market: { id: string; code: string; name: string };
  declaredAmountXaf: string;
  receivedAmountXaf: string;
  status: string;
  cashierId: string | null;
  discrepancy?: { id: string; amountXaf: string; reason?: string | null };
  transactions: RemittanceTransaction[];
  createdAt: Date;
}

export interface RemittanceTransaction {
  id: string;
  clientId?: string;
  cycleId?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION';
  amountXaf: string;
  status: string;
}

export interface RemittanceDetailResponse {
  id: string;
  agent: { id: string; username: string; fullName: string };
  branch: { id: string; code: string; name: string };
  market: { id: string; code: string; name: string };
  declaredAmountXaf: string;
  receivedAmountXaf: string;
  status: string;
  cashierId: string | null;
  discrepancy: { id: string; amountXaf: string; reason?: string | null } | null;
  transactions: RemittanceTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RemittancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    agentId?: string;
    branchId?: string;
    marketId?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.RemittanceWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.agentId) where.agentId = params.agentId;
    if (params.branchId) where.branchId = params.branchId;
    if (params.marketId) where.marketId = params.marketId;
    if (params.fromDate) where.createdAt = { gte: params.fromDate };
    if (params.toDate) where.createdAt = { ...where.createdAt, lte: params.toDate };

    const [items, total] = await Promise.all([
      this.prisma.remittance.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          agent: {
            select: { id: true, username: true, fullName: true },
          },
          branch: {
            select: { id: true, code: true, name: true },
          },
          market: {
            select: { id: true, code: true, name: true },
          },
          discrepancy: {
            select: {
              id: true,
              amountXaf: true,
              reason: true,
            },
          },
          transactions: {
            orderBy: [{ createdAt: 'asc' }],
            select: {
              id: true,
              clientId: true,
              cycleId: true,
              type: true,
              amountXaf: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.remittance.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        agent: r.agent,
        branch: r.branch,
        market: r.market,
        declaredAmountXaf: r.declaredAmountXaf.toString(),
        receivedAmountXaf: r.receivedAmountXaf.toString(),
        status: r.status,
        cashierId: r.cashierId,
        discrepancy: r.discrepancy ?? undefined,
        transactions: r.transactions.map((t) => ({
          id: t.id,
          clientId: t.clientId,
          cycleId: t.cycleId,
          type: t.type,
          amountXaf: t.amountXaf.toString(),
          status: t.status,
        })),
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
'''

with open('backend/src/remises/remittances.service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Part 1 written')

