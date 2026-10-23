import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listClients(_actor: any) {
    return this.prisma.client.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        branchId: true,
        createdAt: true,
      },
    });
  }

  async createClient(_actor: any, input: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    branchId: string;
  }) {
    this.requireRole(_actor, ['ADMIN', 'SUPERVISOR']);
    
    // Check for duplicate client (same name + phone)
    const existing = await this.prisma.client.findFirst({
      where: {
        OR: [
          { firstName: input.firstName, lastName: input.lastName },
          { phone: input.phone ?? undefined },
        ],
      },
    });
    if (existing) {
      throw new Error('Un client avec ces coordonnées existe déjà.');
    }

    return this.prisma.client.create({
      data: {
        clientCode: `CLT-${Date.now()}`,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        status: 'PROVISIONAL',
        branchId: input.branchId,
        createdBy: _actor.id,
        branch: { connect: { id: input.branchId } },
        creator: { connect: { id: _actor.id } },
      },
      select: {
        id: true,
        clientCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async updateClientStatus(
    _actor: any,
    clientId: string,
    status: 'PROVISIONAL' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED',
  ) {
    this.requireRole(_actor, ['ADMIN', 'SUPERVISOR']);
    
    const valid = ['PROVISIONAL', 'ACTIVE', 'REJECTED', 'ARCHIVED'].includes(status);
    if (!valid) throw new BadRequestException('Statut invalide.');
    
    return this.prisma.client.update({
      where: { id: clientId },
      data: { status },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  private requireRole(_actor: any, allowed: string[]) {
    if (!allowed.includes(_actor.role)) {
      throw new Error('Action non autorisée pour ce rôle.');
    }
  }
}