import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

type TransactionClient = Prisma.TransactionClient;

type StringValue = { type: 'string'; value: string };
type NumberValue = { type: 'number'; value: number };
type Value = StringValue | NumberValue;

@Injectable()
export class SystemSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: [{ key: 'asc' }],
      select: {
        id: true,
        key: true,
        label: true,
        description: true,
        stringValue: true,
        numberValue: true,
        isSecure: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return settings.map((s) => ({
      ...s,
      stringValue: s.stringValue ?? null,
      numberValue: s.numberValue ?? null,
    }));
  }

  async update(
    actor: AuthenticatedPrincipal,
    key: string,
    value: Value,
  ) {
    if (key === 'database_url') {
      throw new BadRequestException('Le paramètre database_url ne peut pas être modifié par l\'API.');
    }

    if (actor.role !== 'ADMIN' && actor.role !== 'SUPERVISOR') {
      throw new ForbiddenException('Seul un administrateur ou superviseur peut mettre à jour les paramètres.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.systemSetting.findUnique({
        where: { key },
        select: {
          id: true,
          label: true,
          description: true,
          stringValue: true,
          numberValue: true,
          isSecure: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (existing && existing.isSecure) {
        throw new ForbiddenException('Ce paramètre est sécurisé et ne peut pas être modifié par l\'API.');
      }

      let result;
      if (existing) {
        const updateData: Prisma.SystemSettingUpdateInput = {
          label: existing.label,
          description: existing.description,
          isSecure: existing.isSecure,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        };

        if (value.type === 'string' && value.value !== existing.stringValue) {
          updateData.stringValue = value.value;
        }
        if (value.type === 'number' && value.value !== existing.numberValue) {
          updateData.numberValue = value.value;
        }

        result = await tx.systemSetting.update({
          where: { key },
          data: updateData,
          select: {
            id: true,
            key: true,
            label: true,
            description: true,
            stringValue: true,
            numberValue: true,
            isSecure: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      } else {
        const uniformValue = (value.type === 'string' ? value.value : value.value.toString()) as string;
        result = await tx.systemSetting.create({
          data: {
            key,
            label: key,
            description: `${key} — valeur ${value.type}`,
            stringValue: value.type === 'string' ? value.value : null,
            numberValue: value.type === 'number' ? value.value : null,
            isSecure: false,
          },
          select: {
            id: true,
            key: true,
            label: true,
            description: true,
            stringValue: true,
            numberValue: true,
            isSecure: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: null,
          action: 'SYSTEM_SETTING_UPDATED',
          entityType: 'system_settings',
          entityId: result.id,
          afterData: {
            key: result.key,
            label: result.label,
            stringValue: result.stringValue,
            numberValue: result.numberValue,
            isSecure: result.isSecure,
          },
          requestId: randomUUID(),
        },
      });

      return result;
    });
  }
}