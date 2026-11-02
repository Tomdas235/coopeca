import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, DossierStatus, DossierEventType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

type TransactionClient = Prisma.TransactionClient;

type CreateDossierInput = {
  clientId: string;
  agentId: string;
  marketId: string;
  dailyAmountXaf: bigint;
  deviceId: string;
  openedAtDeclared?: Date;
  openingBusinessDate?: Date;
};

@Injectable()
export class DossiersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    actor: AuthenticatedPrincipal,
    input: CreateDossierInput,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: input.clientId },
      select: {
        id: true,
        branchId: true,
        marketId: true,
        status: true,
        dossiers: {
          where: { status: DossierStatus.OPEN },
          select: { id: true, status: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable.');
    }

    if (client.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Le client doit être actif pour ouvrir un dossier.',
      );
    }

    if (client.dossiers.length > 0) {
      throw new ConflictException(
        'Ce client possède déjà un dossier ouvert pour cet agent.',
      );
    }

    const agent = await this.prisma.appUser.findUnique({
      where: { id: input.agentId },
      select: { id: true, role: true, isActive: true, branchAccesses: true },
    });

    if (!agent || !agent.isActive) {
      throw new NotFoundException('Agent introuvable ou inactif.');
    }

    if (agent.role !== 'AGENT') {
      throw new ForbiddenException('Seul un agent peut être collecteur.');
    }

    const hasBranchAccess = actor.branches.some(
      ({ id }) => id === client.branchId,
    );
    if (!hasBranchAccess && actor.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Accès refusé pour l\'agence de ce client.',
      );
    }

    const agentBranchAccess = agent.branchAccesses.find(
      ({ branch }) => branch.id === client.branchId,
    );
    if (!agentBranchAccess) {
      throw new ForbiddenException(
        'L\'agent n\'est pas affecté à l\'agence de ce client.',
      );
    }

    const market = await this.prisma.market.findUnique({
      where: { id: input.marketId },
      select: { id: true, isActive: true },
    });
    if (!market || !market.isActive) {
      throw new NotFoundException('Marché introuvable ou inactif.');
    }

    const localReference = `LOC-${input.clientId}-${Date.now()}`;
    const dossierNo = `DOSS-${Date.now()}`;
    const clientOperationId = randomUUID();

    return this.serializableTransaction(async (tx) => {
      const dossier = await tx.dossier.create({
        data: {
          clientId: input.clientId,
          agentId: input.agentId,
          dailyAmountXaf: input.dailyAmountXaf,
          localReference,
          dossierNo,
          clientOperationId,
          deviceId: input.deviceId,
          openedAtDeclared: input.openedAtDeclared ?? new Date(),
          openingBusinessDate:
            input.openingBusinessDate ?? new Date(),
          status: DossierStatus.OPEN,
          version: 1,
        },
        select: {
          id: true,
          clientId: true,
          agentId: true,
          dailyAmountXaf: true,
          localReference: true,
          dossierNo: true,
          clientOperationId: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.dossierStateEvent.create({
        data: {
          dossierId: dossier.id,
          eventType: DossierEventType.OPENED,
          previousStatus: null,
          newStatus: DossierStatus.OPEN,
          actorUserId: actor.id,
          reason: 'Ouverture de dossier',
          deviceId: input.deviceId,
          requestId: randomUUID(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: client.branchId,
          action: 'DOSSIER_OPENED',
          entityType: 'dossiers',
          entityId: dossier.id,
          afterData: {
            clientId: dossier.clientId,
            agentId: dossier.agentId,
            dossierNo: dossier.dossierNo,
            status: dossier.status,
          },
          requestId: randomUUID(),
        },
      });

      return dossier;
    });
  }

  async findOne(actor: AuthenticatedPrincipal, id: string) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true, branchId: true },
        },
        agent: {
          select: { id: true, username: true, fullName: true, role: true },
        },
        cycles: {
          select: { id: true, status: true, fixedAmountXaf: true, installmentCount: true },
          orderBy: { openedAt: 'desc' },
        },
        events: {
          select: { id: true, eventType: true, newStatus: true, reason: true, occurredAt: true, actorUserId: true },
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    if (!dossier) {
      throw new NotFoundException('Dossier introuvable.');
    }

    if (actor.role !== 'ADMIN') {
      const hasAccess = actor.branches.some(
        ({ id }) => id === dossier.client.branchId,
      );
      if (!hasAccess) {
        throw new ForbiddenException('Accès refusé pour ce dossier.');
      }
    }

    return {
      ...dossier,
      dailyAmountXaf: dossier.dailyAmountXaf.toString(),
    };
  }

  async list(
    actor: AuthenticatedPrincipal,
    params: {
      page: number;
      limit: number;
      status?: string;
      clientId?: string;
      agentId?: string;
      branchId?: string;
    },
  ) {
    const where: Prisma.DossierWhereInput = {};

    if (params.status) {
      where.status = params.status as DossierStatus;
    }
    if (params.clientId) {
      where.clientId = params.clientId;
    }
    if (params.agentId) {
      where.agentId = params.agentId;
    }

    if (actor.role !== 'ADMIN') {
      const accessibleBranchIds = actor.branches.map((b) => b.id);
      where.client = {
        branchId: { in: accessibleBranchIds },
      };
    } else if (params.branchId) {
      where.client = { branchId: params.branchId };
    }

    const [items, total] = await Promise.all([
      this.prisma.dossier.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          clientId: true,
          agentId: true,
          dailyAmountXaf: true,
          localReference: true,
          dossierNo: true,
          status: true,
          openedAtDeclared: true,
          closedAt: true,
          createdAt: true,
          client: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          agent: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.dossier.count({ where }),
    ]);

    return {
      items: items.map((d) => ({
        ...d,
        dailyAmountXaf: d.dailyAmountXaf.toString(),
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async close(
    actor: AuthenticatedPrincipal,
    id: string,
    closureReason?: string,
  ) {
    return this.serializableTransaction(async (tx) => {
      const dossier = await tx.dossier.findUnique({
        where: { id },
        include: { client: { select: { branchId: true } } },
      });

      if (!dossier) {
        throw new NotFoundException('Dossier introuvable.');
      }

      if (dossier.status !== DossierStatus.OPEN) {
        throw new BadRequestException(
          'Seul un dossier ouvert peut être clôturé.',
        );
      }

      if (actor.role !== 'ADMIN') {
        const hasAccess = actor.branches.some(
          ({ id }) => id === dossier.client.branchId,
        );
        if (!hasAccess) {
          throw new ForbiddenException('Accès refusé pour ce dossier.');
        }
      }

      const previousStatus = dossier.status;
      const updated = await tx.dossier.update({
        where: { id },
        data: {
          status: DossierStatus.CLOSED,
          closedAt: new Date(),
          closedBy: actor.id,
          closureReason,
          version: dossier.version + 1,
        },
        select: {
          id: true, status: true, closedAt: true, closedBy: true, version: true,
        },
      });

      await tx.dossierStateEvent.create({
        data: {
          dossierId: id,
          eventType: DossierEventType.CLOSED,
          previousStatus,
          newStatus: DossierStatus.CLOSED,
          actorUserId: actor.id,
          reason: closureReason ?? 'Clôture de dossier',
          requestId: randomUUID(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: dossier.client.branchId,
          action: 'DOSSIER_CLOSED',
          entityType: 'dossiers',
          entityId: id,
          beforeData: { status: previousStatus },
          afterData: { status: DossierStatus.CLOSED, closedAt: updated.closedAt },
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
    if (!['ADMIN', 'SUPERVISOR'].includes(actor.role)) {
      throw new ForbiddenException(
        'Seul un administrateur ou superviseur peut rouvrir un dossier.',
      );
    }

    return this.serializableTransaction(async (tx) => {
      const dossier = await tx.dossier.findUnique({
        where: { id },
        include: { client: { select: { branchId: true } } },
      });

      if (!dossier) {
        throw new NotFoundException('Dossier introuvable.');
      }

      if (dossier.status !== DossierStatus.CLOSED) {
        throw new BadRequestException(
          'Seul un dossier clôturé peut être rouvert.',
        );
      }

      if (actor.role !== 'ADMIN') {
        const hasAccess = actor.branches.some(
          ({ id }) => id === dossier.client.branchId,
        );
        if (!hasAccess) {
          throw new ForbiddenException('Accès refusé pour ce dossier.');
        }
      }

      const previousStatus = dossier.status;
      const updated = await tx.dossier.update({
        where: { id },
        data: {
          status: DossierStatus.OPEN,
          closedAt: null,
          closedBy: null,
          closureReason: null,
          version: dossier.version + 1,
        },
        select: {
          id: true, status: true, closedAt: true, version: true,
        },
      });

      await tx.dossierStateEvent.create({
        data: {
          dossierId: id,
          eventType: DossierEventType.REOPENED,
          previousStatus,
          newStatus: DossierStatus.OPEN,
          actorUserId: actor.id,
          reason,
          requestId: randomUUID(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: dossier.client.branchId,
          action: 'DOSSIER_REOPENED',
          entityType: 'dossiers',
          entityId: id,
          beforeData: { status: previousStatus },
          afterData: { status: DossierStatus.OPEN },
          requestId: randomUUID(),
        },
      });

      return updated;
    });