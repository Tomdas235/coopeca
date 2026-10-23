import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedPrincipal } from '../auth/auth.types';

export interface ClientListItem {
  id: string;
  clientCode: string;
  fullName: string;
  status: string;
  branchId: string | null;
  marketId: string | null;
}

export interface ClientFilters {
  status?: string;
  agencyId?: string;
  marketId?: string;
  agentId?: string;
  search?: string;
  fromCreatedAt?: string;
  toCreatedAt?: string;
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters: ClientFilters;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {};

    if (params.filters.status) where.status = params.filters.status;
    if (params.filters.agencyId) where.branchId = params.filters.agencyId;
    if (params.filters.marketId) where.marketId = params.filters.marketId;
    if (params.filters.agentId) where.collectionAgentId = params.filters.agentId;
    if (params.filters.search) {
      where.OR = [
        { clientCode: { contains: params.filters.search, mode: 'insensitive' } },
        { firstName: { contains: params.filters.search, mode: 'insensitive' } },
        { lastName: { contains: params.filters.search, mode: 'insensitive' } },
      ];
    }
    if (params.filters.fromCreatedAt) {
      where.createdAt = { ...where.createdAt, gte: new Date(params.filters.fromCreatedAt) };
    }
    if (params.filters.toCreatedAt) {
      where.createdAt = { ...where.createdAt, lte: new Date(params.filters.toCreatedAt) };
    }

    const orderBy: Prisma.ClientOrderByWithRelationInput[] = [];
    const sortField = params.sortBy && ['clientCode', 'firstName', 'lastName', 'createdAt'].includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';
    const sortDirection = params.sortOrder === 'desc' ? 'desc' : 'asc';
    orderBy.push({ [sortField]: sortDirection });

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          clientCode: true,
          firstName: true,
          lastName: true,
          status: true,
          branchId: true,
          marketId: true,
          createdAt: true,
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        clientCode: c.clientCode,
        fullName: `${c.firstName} ${c.lastName}`,
        status: c.status,
        branchId: c.branchId,
        marketId: c.marketId,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        clientCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        neighborhood: true,
        addressDetails: true,
        status: true,
        branchId: true,
        marketId: true,
        collectionAgentId: true,
        createdAt: true,
      },
    });

    if (!client) throw new NotFoundException('Client introuvable.');

    return {
      id: client.id,
      clientCode: client.clientCode,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      neighborhood: client.neighborhood,
      addressDetails: client.addressDetails,
      status: client.status,
      branchId: client.branchId,
      marketId: client.marketId,
      collectionAgentId: client.collectionAgentId,
      createdAt: client.createdAt,
    };
  }

  async create(actor: AuthenticatedPrincipal, input: { clientCode: string; firstName: string; lastName: string; phone?: string | null; neighborhood?: string | null; addressDetails?: string | null; branchId: string; marketId?: string | null; collectionAgentId?: string | null }) {
    // Vérifier si un client avec ce code existe déjà dans la même agence
    const existingClient = await this.prisma.client.findFirst({
      where: {
        clientCode: input.clientCode,
        branchId: input.branchId,
      },
    });

    if (existingClient) {
      throw new ConflictException({ code: 'CLIENT_CODE_DEJA_UTILISE', message: 'Ce code client existe déjà pour cette agence.' });
    }

    // Si collectionAgentId est fourni, vérifier que l'agent appartient à la même agence
    if (input.collectionAgentId) {
      const agentBelongsToBranch = await this.prisma.appUser.findFirst({
        where: {
          id: input.collectionAgentId,
          branchId: input.branchId,
        },
      });

      if (!agentBelongsToBranch) {
        throw new BadRequestException({ code: 'AGENT_NOT_IN_BRANCH', message: 'L\'agent collecteur ne appartient pas à la même agence.' });
      }
    }

    const client = await this.prisma.client.create({
      data: {
        clientCode: input.clientCode,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        neighborhood: input.neighborhood,
        addressDetails: input.addressDetails,
        status: 'PROVISIONAL', // Nouveau client créé hors ligne a le statut PROVISOIRE
        branchId: input.branchId,
        marketId: input.marketId,
        collectionAgentId: input.collectionAgentId,
      },
      select: {
        id: true,
        clientCode: true,
        firstName: true,
        lastName: true,
        status: true,
        branchId: true,
        marketId: true,
        collectionAgentId: true,
        createdAt: true,
      },
    });

    return {
      id: client.id,
      clientCode: client.clientCode,
      firstName: client.firstName,
      lastName: client.lastName,
      status: client.status,
      branchId: client.branchId,
      marketId: client.marketId,
      collectionAgentId: client.collectionAgentId,
      createdAt: client.createdAt,
    };
  }

  async update(id: string, actor: AuthenticatedPrincipal, input: { firstName?: string | null; lastName?: string | null; phone?: string | null; neighborhood?: string | null; addressDetails?: string | null; status?: string | null; branchId?: string | null; marketId?: string | null; collectionAgentId?: string | null; rejectionReason?: string | null; reviewedById?: string | null; reviewedAt?: Date | null }) {
    // Vérifier que le client existe
    await this.prisma.client.findUnique({ where: { id } });

    // Si on modifie la branche, vérifier que l'agent collecteur appartient à la nouvelle agence
    if (input.collectionAgentId && input.branchId) {
      const agentBelongsToBranch = await this.prisma.appUser.findFirst({
        where: {
          id: input.collectionAgentId,
          branchId: input.branchId,
        },
      });

      if (!agentBelongsToBranch) {
        throw new BadRequestException({ code: 'AGENT_NOT_IN_BRANCH', message: 'L\'agent collecteur ne appartient pas à la même agence.' });
      }
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        neighborhood: input.neighborhood,
        addressDetails: input.addressDetails,
        status: input.status,
        branchId: input.branchId,
        marketId: input.marketId,
        collectionAgentId: input.collectionAgentId,
        rejectionReason: input.rejectionReason,
        reviewedById: input.reviewedById,
        reviewedAt: input.reviewedAt,
      },
      select: {
        id: true,
        clientCode: true,
        firstName: true,
        lastName: true,
        status: true,
        branchId: true,
        marketId: true,
        collectionAgentId: true,
        createdAt: true,
      },
    });

    return {
      id: client.id,
      clientCode: client.clientCode,
      firstName: client.firstName,
      lastName: client.lastName,
      status: client.status,
      branchId: client.branchId,
      marketId: client.marketId,
      collectionAgentId: client.collectionAgentId,
      createdAt: client.createdAt,
    };
  }

  async getBalance(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!client) throw new NotFoundException('Client introuvable.');

    // Récupérer les transactions de tontine cycle pour ce client
    const cycleTransactions = await this.prisma.tontineCycleTransaction.findMany({
      where: { clientId: id },
      select: {
        type: true,
        amountXaf: true,
      },
    });

    // Calculer le solde : dépôts - retraits
    let balanceXaf = 0n;
    for (const tx of cycleTransactions) {
      if (tx.type === 'DEPOSIT') {
        balanceXaf += BigInt(tx.amountXaf);
      } else if (tx.type === 'WITHDRAWAL') {
        balanceXaf -= BigInt(tx.amountXaf);
      }
      // COMMISSION est déjà comptabilisée separately
    }

    return { clientId: id, balanceXaf: balanceXaf.toString() };
  }
}