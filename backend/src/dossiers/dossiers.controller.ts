import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { DossiersService } from './dossiers.service';

const uuid = z.string().uuid();

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/, 'Page invalide.').default('1').transform(Number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').default('20').transform(Number),
});

const createDossierSchema = z.object({
  clientId: uuid,
  agentId: uuid,
  marketId: uuid,
  dailyAmountXaf: z.string().regex(/^[1-9][0-9]*$/, 'Le montant doit être un entier positif.'),
  deviceId: z.string().trim().min(1).max(120),
  openedAtDeclared: z.string().datetime({ offset: true }).optional(),
  openingBusinessDate: z.string().datetime({ offset: true }).optional(),
}).strict();

const closeDossierSchema = z.object({
  closureReason: z.string().max(1000).optional(),
}).strict();

const reopenDossierSchema = z.object({
  reason: z.string().trim().min(1).max(1000, 'Motif requis pour la réouverture.'),
}).strict();

@Controller('dossiers')
@UseGuards(AuthGuard)
export class DossiersController {
  constructor(private readonly dossiersService: DossiersService) {}

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = createDossierSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de dossier invalides.');
    }
    return this.dossiersService.create(actor, {
      ...input.data,
      dailyAmountXaf: BigInt(input.data.dailyAmountXaf),
      openedAtDeclared: input.data.openedAtDeclared ? new Date(input.data.openedAtDeclared) : undefined,
      openingBusinessDate: input.data.openingBusinessDate ? new Date(input.data.openingBusinessDate) : undefined,
    });
  }

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query() query: unknown,
  ) {
    const pageParams = pageSchema.safeParse({ page: (query as any)?.page });
    const limitParams = limitSchema.safeParse({ limit: (query as any)?.limit });
    const status = (query as any)?.status;
    const clientId = (query as any)?.clientId;
    const agentId = (query as any)?.agentId;
    const branchId = (query as any)?.branchId;

    if (!pageParams.success || !limitParams.success) {
      throw new BadRequestException('Paramètres de pagination invalides.');
    }

    return this.dossiersService.list(actor, {
      page: pageParams.data.page,
      limit: limitParams.data.limit,
      status,
      clientId,
      agentId,
      branchId,
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de dossier invalide.');
    }
    return this.dossiersService.findOne(actor, id);
  }

  @Patch(':id/close')
  close(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de dossier invalide.');
    }
    const input = closeDossierSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Motif de clôture invalide.');
    }
    return this.dossiersService.close(actor, id, input.data.closureReason);
  }

  @Patch(':id/reopen')
  reopen(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de dossier invalide.');
    }
    const input = reopenDossierSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Motif de réouverture requis.');
    }
    return this.dossiersService.reopen(actor, id, input.data.reason);
  }
}