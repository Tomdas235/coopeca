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
import { CyclesService } from '../cycles/cycles.service';

const uuid = z.string().uuid();
const amount = z.string().regex(/^[1-9][0-9]*$/, 'Le montant XAF doit être un entier positif sérialisé en chaîne.');

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

@Controller('admin/cycles')
@UseGuards(AuthGuard)
export class AdminCyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedPrincipal) {
    return this.cyclesService.listMarkets();
  }

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
    return this.cyclesService.assignClientToCycleProduct(actor, clientId, {
      marketId: input.data.marketId,
      collectionAgentId: input.data.collectionAgentId,
    });
  }

  @Post('open')
  openCycle(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = openCycleSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Montant fixe et identifiant opération valides requis.');
    }
    return this.cyclesService.openCycleProduct(actor, {
      fixedAmountXaf: BigInt(input.data.fixedAmountXaf),
      clientOperationId: input.data.clientOperationId,
    });
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
    return this.cyclesService.changeCycleState(actor, cycleId, 'SUSPEND', {});
  }

  @Post('tontine-cycles/:cycleId/resume')
  resume(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
    @Body() body: unknown,
  ) {
    return this.cyclesService.changeCycleState(actor, cycleId, 'RESUME', {});
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
}