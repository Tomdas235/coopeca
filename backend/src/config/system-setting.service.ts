import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { randomUUID } from 'node:crypto';
import { AuthenticatedBranch, AuthenticatedPrincipal } from '../auth/auth.types';

@Injectable()
export class SystemSettingService {
  protected readonly reservedKeys = new Set(['database_url']);

  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return [];
  }

  async update(
    actor: AuthenticatedPrincipal,
    key: string,
    value: string | number,
  ) {
    if (this.reservedKeys.has(key)) {
      throw new BadRequestException(`La clé '${key}' est protégée et ne peut pas être modifiée.`);
    }
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPERVISOR') {
      throw new ForbiddenException('Seul un administrateur ou superviseur peut modifier les paramètres.');
    }

    const jsonValue:
      | { type: 'string'; value: string }
      | { type: 'number'; value: number } = typeof value === 'string'
      ? { type: 'string', value: value }
      : { type: 'number', value: Number(value) };

    const primaryBranch = actor.branches.find(
      (b): b is AuthenticatedBranch => b.isPrimary && 'id' in b && 'code' in b && 'name' in b,
    );
    const existing = await this.prisma.systemSetting.findFirst({
      where: {
        branchId: primaryBranch?.id,
        settingKey: key,
      },
    });

    let result;
    if (existing) {
      result = await this.prisma.systemSetting.update({
        where: { id: existing.id },
        data: {
          settingValue: jsonValue,
          updatedAt: new Date(),
          updatedBy: actor.id,
        },
        select: {
          id: true,
          settingKey: true,
          settingValue: true,
          updatedBy: true,
          updatedAt: true,
        },
      });
    } else {
      if (!primaryBranch) {
        throw new BadRequestException('Aucune agence primaire définie pour définir un paramètre.');
      }
      result = await this.prisma.systemSetting.create({
        data: {
          branchId: primaryBranch.id,
          settingKey: key,
          settingValue: jsonValue,
          updatedBy: actor.id,
        },
        select: {
          id: true,
          settingKey: true,
          settingValue: true,
          updatedBy: true,
          updatedAt: true,
        },
      });
    }

    await this.prisma.$executeRaw`
      INSERT INTO audit_log (actor_user_id, branch_id, action, entity_type, entity_id, after_data, request_id)
      VALUES (
        ${actor.id},
        ${primaryBranch?.id ?? null},
        'SYSTEM_SETTING_UPDATED',
        'system_settings',
        ${result.id},
        ${JSON.stringify({
          key: result.settingKey,
          value: result.settingValue,
        })},
        ${randomUUID()}
      )
    `;

    return {
      id: result.id,
      key: result.settingKey,
      value: result.settingValue,
    };
  }
}
