import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { CyclesService } from './cycles.service';

const uuid = z.string().uuid();
const amount = z.string().regex(/^[1-9][0-9]*$/, 'Le montant XAF doit être un entier positif sérialisé en chaîne.');

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/, 'Page invalide.').default('1').transform(Number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').default('20').transform(Number),
});


const marketSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
}).strict();

const marketActiveSchema = z.object({ isActive: z.boolean() }).strict();
const clientCycleAssignmentSchema = z.object({
  marketId: uuid,
  collectionAgentId: uuid,
}).strict();

const openCycleSchema = z.object({
  fixedAmountXaf: amount,
  clientOperationId: uuid,
}).strict();

const depositSchema = z.object({
  amountXaf: amount,
  idempotencyKey: uuid,
  declaredAt: z.string().datetime({ offset: true }).optional(),
}).strict();

const stateChangeSchema = z.object({
  requestId: uuid,
  reason: z.string().max(1000).optional(),
}).strict();

const withdrawalSchema = z.object({
  amountXaf: amount,
  closesCycle: z.boolean().default(false),
  idempotencyKey: uuid,
  reason: z.string().max(1000).optional(),
}).strict();

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().max(1000).optional(),
}).strict().superRefine((value, context) => {
  if (value.decision === 'REJECT' && !value.reason?.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['reason'], message: 'Un motif est requis pour rejeter le retrait.' });
  }
});

@Controller('markets')
@UseGuards(AuthGuard)
export class MarketsController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get()
  list() {
    return this.cyclesService.listMarkets();
  }

  @Post()
  create(@CurrentUser() actor: AuthenticatedPrincipal, @Body() body: unknown) {
    const input = marketSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Code et nom de marché valides requis.');
    return this.cyclesService.createMarket(actor, input.data);
  }

  @Post(':marketId/active')
  setActive(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('marketId') marketId: string,
    @Body() body: unknown,
  ) {
    const id = uuid.safeParse(marketId);
    const input = marketActiveSchema.safeParse(body);
    if (!id.success || !input.success) throw new BadRequestException('Marché et état actif valides requis.');
    return this.cyclesService.setMarketActive(actor, marketId, input.data.isActive);
  }
}

@Controller()
@UseGuards(AuthGuard)
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Post('clients/:clientId/cycle-assignment')
  assignClient(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('clientId') clientId: string,
    @Body() body: unknown,
  ) {
    const id = uuid.safeParse(clientId);
    const input = clientCycleAssignmentSchema.safeParse(body);
    if (!id.success || !input.success) {
      throw new BadRequestException('Client, marché et agent collecteur valides requis.');
    }
    return this.cyclesService.assignClientToCycleProduct(actor, clientId, input.data);
  }

  @Get('dossiers/:dossierId/cycles')
  listDossierCycles(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('dossierId') dossierId: string,
  ) {
    if (!uuid.safeParse(dossierId).success) throw new BadRequestException('Identifiant de dossier invalide.');
    return this.cyclesService.listDossierCycles(actor, dossierId);
  }

  @Post('dossiers/:dossierId/cycles')
  open(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('dossierId') dossierId: string,
    @Body() body: unknown,
  ) {
    const parsedId = uuid.safeParse(dossierId);
    const input = openCycleSchema.safeParse(body);
    if (!parsedId.success || !input.success) {
      throw new BadRequestException('Dossier, montant fixe entier XAF et clé d’opération valides requis.');
    }
    return this.cyclesService.openCycle(actor, dossierId, {
      fixedAmountXaf: BigInt(input.data.fixedAmountXaf),
      clientOperationId: input.data.clientOperationId,
    });
  }

  @Get('tontine-cycles/:cycleId')
  getCycle(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
  ) {
    if (!uuid.safeParse(cycleId).success) throw new BadRequestException('Identifiant de cycle invalide.');
    return this.cyclesService.getCycle(actor, cycleId);
  }

  @Post('tontine-cycles/:cycleId/deposits')
  deposit(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
    @Body() body: unknown,
  ) {
    const parsedId = uuid.safeParse(cycleId);
    const input = depositSchema.safeParse(body);
    if (!parsedId.success || !input.success) {
      throw new BadRequestException('Cycle, versement entier XAF et clé idempotente valides requis.');
    }
    return this.cyclesService.deposit(actor, cycleId, {
      amountXaf: BigInt(input.data.amountXaf),
      idempotencyKey: input.data.idempotencyKey,
      declaredAt: input.data.declaredAt ? new Date(input.data.declaredAt) : undefined,
    });
  }

  @Post('tontine-cycles/:cycleId/suspend')
  suspend(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
    @Body() body: unknown,
  ) {
    return this.changeState(actor, cycleId, body, 'SUSPEND');
  }

  @Post('tontine-cycles/:cycleId/resume')
  resume(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
    @Body() body: unknown,
  ) {
    return this.changeState(actor, cycleId, body, 'RESUME');
  }

  @Post('tontine-cycles/:cycleId/withdrawals')
  requestWithdrawal(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
    @Body() body: unknown,
  ) {
    const parsedId = uuid.safeParse(cycleId);
    const input = withdrawalSchema.safeParse(body);
    if (!parsedId.success || !input.success) {
      throw new BadRequestException('Cycle, montant entier XAF et clé idempotente valides requis.');
    }
    return this.cyclesService.requestWithdrawal(actor, cycleId, {
      amountXaf: BigInt(input.data.amountXaf),
      closesCycle: input.data.closesCycle,
      idempotencyKey: input.data.idempotencyKey,
      reason: input.data.reason,
    });
  }

  @Get('withdrawals/pending')
  listPendingWithdrawals(@CurrentUser() actor: AuthenticatedPrincipal) {
    return this.cyclesService.listPendingWithdrawals(actor);
  }

  @Get('financial-summary')
  getFinancialSummary(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
    @Query('branchId') branchId: string | undefined,
  ) {
    if (fromDate && !z.string().datetime({ offset: true }).safeParse(fromDate).success) {
      throw new BadRequestException('Date de début invalide.');
    }
    if (toDate && !z.string().datetime({ offset: true }).safeParse(toDate).success) {
      throw new BadRequestException('Date de fin invalide.');
    }
    if (branchId && !uuid.safeParse(branchId).success) {
      throw new BadRequestException('Identifiant d\'agence invalide.');
    }
    return this.cyclesService.getFinancialSummary(actor, { fromDate, toDate, branchId });
  }

  @Get('reconciliation-report')
  getReconciliationReport(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
    @Query('branchId') branchId: string | undefined,
    @Query('status') status: string | undefined,
  ) {
    const pageParams = pageSchema.safeParse({ page });
    const limitParams = limitSchema.safeParse({ limit });
    if (!pageParams.success || !limitParams.success) {
      throw new BadRequestException('Paramètres de pagination invalides.');
    }
    if (fromDate && !z.string().datetime({ offset: true }).safeParse(fromDate).success) {
      throw new BadRequestException('Date de début invalide.');
    }
    if (toDate && !z.string().datetime({ offset: true }).safeParse(toDate).success) {
      throw new BadRequestException('Date de fin invalide.');
    }
    if (branchId && !uuid.safeParse(branchId).success) {
      throw new BadRequestException('Identifiant d\'agence invalide.');
    }
    return this.cyclesService.getReconciliationReport(actor, {
      page: pageParams.data.page,
      limit: limitParams.data.limit,
      fromDate,
      toDate,
      branchId,
      status,
    });
  }

  @Post('withdrawals/:withdrawalRequestId/review')
  reviewWithdrawal(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('withdrawalRequestId') withdrawalRequestId: string,
    @Body() body: unknown,
  ) {
    const id = uuid.safeParse(withdrawalRequestId);
    const input = decisionSchema.safeParse(body);
    if (!id.success || !input.success) {
      throw new BadRequestException('Décision de retrait et identifiant valides requis.');
    }
    return this.cyclesService.reviewWithdrawal(actor, withdrawalRequestId, input.data.decision, input.data.reason);
  }

  private changeState(
    actor: AuthenticatedPrincipal,
    cycleId: string,
    body: unknown,
    action: 'SUSPEND' | 'RESUME',
  ) {
    const parsedId = uuid.safeParse(cycleId);
    const input = stateChangeSchema.safeParse(body);
    if (!parsedId.success || !input.success) {
      throw new BadRequestException('Cycle et clé de transition valides requis.');
    }
    return this.cyclesService.changeCycleState(actor, cycleId, action, input.data);
  }
}

