import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { RemittancesService, RemittanceFilters } from './remittances.service';

const uuid = z.string().uuid();

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

const createRemittanceSchema = z.object({
  branchId: uuid,
  declaredAmountXaf: z.string().regex(/^[1-9][0-9]*$/, 'Montant invalide.'),
  description: z.string().max(500).optional(),
}).strict();

const receiveRemittanceSchema = z.object({
  receivedTotalXaf: z.string().regex(/^[1-9][0-9]*$/, 'Montant reçu invalide.'),
  cashierNote: z.string().max(500).optional(),
}).strict();

const discrepancyRemittanceSchema = z.object({
  discrepancyAmountXaf: z.string().regex(/^[0-9][0-9]*$/, 'Montant d\'écart invalide.'),
  discrepancyReason: z.string().trim().min(1).max(1000, 'Motif requis pour l\'écart.'),
}).strict();

@Controller('remittances')
@UseGuards(AuthGuard)
export class RemittancesController {
  constructor(private readonly remittancesService: RemittancesService) {}

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = createRemittanceSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de remise invalides.');
    }
    return this.remittancesService.create(actor, input.data);
  }

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

  @Patch(':id/receive')
  receive(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de remise invalide.');
    }
    const input = receiveRemittanceSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Montant reçu invalide.');
    }
    return this.remittancesService.receive(actor, id, input.data.receivedTotalXaf, input.data.cashierNote);
  }

  @Patch(':id/discrepancy')
  discrepancy(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de remise invalide.');
    }
    const input = discrepancyRemittanceSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données d\'écart invalides.');
    }
    return this.remittancesService.declareDiscrepancy(actor, id, input.data.discrepancyAmountXaf, input.data.discrepancyReason);
  }
}

