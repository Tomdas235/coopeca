import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { RemittancesService, PageOptions, RemittanceFilters } from './remittances.service';

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/).transform(Number).default(1),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').transform(Number).default(20),
});

const filterSchema = z.object({
  status: z.string().optional(),
  agentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  marketId: z.string().uuid().optional(),
  fromDate: z.string().datetime({ offset: true }).optional(),
  toDate: z.string().datetime({ offset: true }).optional(),
});

const remittanceCreateSchema = z.object({
  agentId: z.string().uuid(),
  branchId: z.string().uuid(),
  marketId: z.string().uuid(),
  periodStart: z.string().datetime({ offset: true }),
  periodEnd: z.string().datetime({ offset: true }),
  declaredAmountXaf: z.string().regex(/^[1-9][0-9]*$/, 'Montant entier XAF requis.'),
  description: z.string().max(500).optional(),
});

@Controller('remittances')
@UseGuards(AuthGuard)
export class RemittancesController {
  constructor(private readonly remittancesService: RemittancesService) {}

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query() filters: RemittanceFilters,
  ) {
    const pageParams = pageSchema.safeParse({ page });
    const limitParams = limitSchema.safeParse({ limit });
    const filterParams = filterSchema.safeParse(filters);

    if (!pageParams.success || !limitParams.success || !filterParams.success) {
      throw new BadRequestException('Paramètres de pagination ou filtres invalides.');
    }

    return this.remittancesService.findAll({
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

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = remittanceCreateSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de la remise invalides.');
    }

    return this.remittancesService.create(actor, input.data);
  }
}
