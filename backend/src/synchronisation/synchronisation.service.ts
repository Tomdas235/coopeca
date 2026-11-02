import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SyncStatus } from '@prisma/client';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SynchronisationService {
  constructor(private readonly prisma: PrismaService) {}

  async listPending(
    actor: AuthenticatedPrincipal,
    params: { page: number; limit: number },
  ) {
    const where: Prisma.SyncEventWhereInput = {
      status: SyncStatus.RECEIVED,
    };

    if (actor.role !== 'ADMIN') {
      const accessibleBranchIds = actor.branches.map((b) => b.id);
      where.branchId = { in: accessibleBranchIds };
    }

    const [items, total] = await Promise.all([
      this.prisma.syncEvent.findMany({
        where,
        orderBy: [{ receivedAt: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          userId: true,
          branchId: true,
          deviceId: true,
          clientOperationId: true,
          entityType: true,
          entityId: true,
          payloadHash: true,
          status: true,
          responseCode: true,
          responseMessage: true,
          receivedAt: true,
          processedAt: true,
        },
      }),
      this.prisma.syncEvent.count({ where }),
    ]);

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async confirm(
    actor: AuthenticatedPrincipal,
    eventId: string,
    status: 'APPLIED' | 'REJECTED',
    reason?: string,
  ) {
    const event = await this.prisma.syncEvent.findUnique({
      where: { id: eventId },
      include: { branch: true, user: true },
    });

    if (!event) {
      throw new NotFoundException('Événement de synchronisation introuvable.');
    }

    if (actor.role !== 'ADMIN') {
      const hasAccess = actor.branches.some(
        ({ id }) => id === event.branchId,
      );
      if (!hasAccess) {
        throw new ForbiddenException('Accès refusé pour cet événement.');
      }
    }

    if (event.status !== SyncStatus.RECEIVED) {
      throw new BadRequestException(
        `Cet événement a déjà été traité (statut : ${event.status}).`,
      );
    }

    const syncStatus = status === 'APPLIED' ? SyncStatus.APPLIED : SyncStatus.REJECTED;

    return this.prisma.syncEvent.update({
      where: { id: eventId },
      data: {
        status: syncStatus,
        processedAt: new Date(),
        responseCode: syncStatus,
        responseMessage: reason ?? null,
      },
      select: {
        id: true,
        status: true,
        processedAt: true,
        responseCode: true,
        responseMessage: true,
      },
    });
  }
}