import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listClients(actor: any) {
    return this.prisma.client.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        status: true,
        branchId: true,
        createdAt: true,
      },
    });
  }

  async createClient(actor: any, input: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
  }) {
    this.requireRole(actor, ['ADMIN', 'SUPERVISOR']);
    
    // Check for duplicate client (same name + phone)
    const existing = await this.prisma.client.findFirst({
      where: {
        OR: [
          { firstName: input.firstName, lastName: input.lastName },
          { phone: input.phone },
        ].filter(Boolean) as any,
      },
    });
    if (existing) {
      throw new Error({
        code: 'DOUBLE_CLIENT',
        message: 'Un client avec ces coordonnées existe déjà.',
      });
    }

    return this.prisma.client.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        address: input.address,
        status: 'PROVISIONAL', // New clients created offline are PROVISIONAL
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async updateClientStatus(
    actor: any,
    clientId: string,
    status: 'PROVISIONAL' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED',
  ) {
    this.requireRole(actor, ['ADMIN', 'SUPERVISOR']);
    
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

  private requireRole(actor: any, allowed: string[]) {
    if (!allowed.includes(actor.role)) {
      throw new Error('Action non autorisée pour ce rôle.');
    }
  }
}