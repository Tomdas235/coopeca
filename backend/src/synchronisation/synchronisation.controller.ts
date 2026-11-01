import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { SynchronisationService } from './synchronisation.service';

const uuid = z.string().uuid();

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/, 'Page invalide.').default('1').transform(Number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').default('20').transform(Number),
});

const confirmSyncSchema = z.object({
  eventId: uuid,
  status: z.enum(['APPLIED', 'REJECTED']),
  reason: z.string().max(1000).optional(),
}).strict();

@Controller('sync')
@UseGuards(AuthGuard)
export class SynchronisationController {
  constructor(private readonly syncService: SynchronisationService) {}

  @Get('pending')
  listPending(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query() query: unknown,
  ) {
    const pageParams = pageSchema.safeParse({ page: (query as any)?.page });
    const limitParams = limitSchema.safeParse({ limit: (query as any)?.limit });

    if (!pageParams.success || !limitParams.success) {
      throw new BadRequestException('Paramètres de pagination invalides.');
    }

    return this.syncService.listPending(actor, {
      page: pageParams.data.page,
      limit: limitParams.data.limit,
    });
  }

  @Post('confirm')
  confirm(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = confirmSyncSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de confirmation invalides.');
    }
    return this.syncService.confirm(actor, input.data.eventId, input.data.status, input.data.reason);
  }
}