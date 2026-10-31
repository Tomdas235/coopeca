import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { RemittancesService, RemittanceFilters } from './remittances.service';

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/, 'Page invalide.').default('1').transform(Number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').default('20').transform(Number),
});

const filterSchema = z.object({
  status: z.string().optional(),
  agentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  marketId: z.string().uuid().optional(),
  fromDate: z.string().datetime({ offset: true }).optional(),
  toDate: z.string().datetime({ offset: true }).optional(),
});

@Controller('remittances')
@UseGuards(AuthGuard)
export class RemittancesController {
  constructor(private readonly remittancesService: RemittancesService) {}

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query() filters: RemittanceFilters,
  ) {
    const pageParams = pageSchema.safeParse({ page });
    const limitParams = limitSchema.safeParse({ limit });
    const filterParams = filterSchema.safeParse(filters);

    if (!pageParams.success || !limitParams.success || !filterParams.success) {
      throw new BadRequestException('Paramètres de pagination ou filtres invalides.');
    }

    return this.remittancesService.findAll(actor, {
      page: pageParams.data.page,
      limit: limitParams.data.limit,
      status: filterParams.data.status,
      agentId: filterParams.data.agentId,
      branchId: filterParams.data.branchId,
      marketId: filterParams.data.marketId,
      fromDate: filterParams.data.fromDate,
      toDate: filterParams.data.toDate,
    });
  }

}

