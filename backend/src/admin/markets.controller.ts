import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { MarketsService } from '../markets/markets.service';

const uuid = z.string().uuid();
const amount = z
  .string()
  .regex(/^[1-9][0-9]*$/, 'Le montant XAF doit être un entier positif sérialisé en chaîne.');

const marketSchema = z
  .object({
    code: z.string().trim().min(1).max(40),
    name: z.string().trim().min(1).max(160),
  })
  .strict();

const marketActiveSchema = z.object({ isActive: z.boolean() }).strict();

@Controller('admin/markets')
@UseGuards(AuthGuard)
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedPrincipal) {
    return this.marketsService.listMarkets(actor);
  }

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = marketSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Code et nom de marché valides requis.');
    return this.marketsService.createMarket(actor, input.data);
  }

  @Post(':marketId/active')
  setActive(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('marketId') marketId: string,
    @Body() body: unknown,
  ) {
    const id = uuid.safeParse(marketId);
    const input = marketActiveSchema.safeParse(body);
    if (!id.success || !input.success)
      throw new BadRequestException('Marché et état actif valides requis.');
    return this.marketsService.setMarketActive(actor, marketId, input.data.isActive);
  }
}