import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { SystemSettingService } from './system-setting.service';

const uuid = z.string().uuid();
const keySchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Clé invalide (lettres, chiffres, underscore, hyphen).');
const valueStringSchema = z.string().max(500).optional();
const valueNumberSchema = z.number().int().min(0).max(2147483647).optional();

const updateSettingSchema = z
  .object({
    stringValue: valueStringSchema,
    numberValue: valueNumberSchema,
  })
  .refine((value) => value.stringValue !== undefined || value.numberValue !== undefined, {
    message: 'Au moins un champ de valeur doit être fourni.',
  });

@Controller('config')
@UseGuards(AuthGuard)
export class SystemSettingController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  @Get('system-settings')
  list() {
    return this.systemSettingService.list();
  }

  @Put('system-settings/:key')
  update(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('key') key: string,
    @Body() body: unknown,
  ) {
    if (!['ADMIN', 'SUPERVISOR'].includes(actor.role)) {
      throw new ForbiddenException('Seul un administrateur ou superviseur peut mettre à jour les paramètres.');
    }

    const input = updateSettingSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de paramètre invalides.');
    }

    return this.systemSettingService.update(actor, key, input.data);
  }
}