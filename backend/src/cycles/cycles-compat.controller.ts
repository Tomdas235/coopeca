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

const depositSchema = z.object({
  amountXaf: amount,
  idempotencyKey: uuid,
  declaredAt: z.string().datetime({ offset: true }).optional(),
}).strict();

const withdrawalSchema = z.object({
  amountXaf: amount,
  closesCycle: z.boolean().default(false),
  idempotencyKey: uuid,
  reason: z.string().max(1000).optional(),
}).strict();

@Controller('cycles')
@UseGuards(AuthGuard)
export class CyclesCompatController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Post('tontine-cycles/:cycleId/deposits')
  depositCompat(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(cycleId).success) {
      throw new BadRequestException('Identifiant de cycle invalide.');
    }
    const input = depositSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de versement invalides.');
    }
    return this.cyclesService.deposit(actor, cycleId, input.data);
  }

  @Post('tontine-cycles/:cycleId/withdrawals')
  withdrawalCompat(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('cycleId') cycleId: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(cycleId).success) {
      throw new BadRequestException('Identifiant de cycle invalide.');
    }
    const input = withdrawalSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de retrait invalides.');
    }
    return this.cyclesService.requestWithdrawal(actor, cycleId, input.data);
  }

  @Get('withdrawals/pending')
  listPendingWithdrawalsCompat(
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.cyclesService.listPendingWithdrawals(actor);
  }

  @Post('admin/cycles/withdrawals/:withdrawalRequestId/review')
  reviewWithdrawalCompat(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('withdrawalRequestId') withdrawalRequestId: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(withdrawalRequestId).success) {
      throw new BadRequestException('Identifiant de demande de retrait invalide.');
    }
    const decisionSchema = z.object({
      decision: z.enum(['APPROVE', 'REJECT']),
      reason: z.string().max(1000).optional(),
    }).strict().superRefine((value, context) => {
      if (value.decision === 'REJECT' && !value.reason?.trim()) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['reason'], message: 'Un motif est requis pour rejeter le retrait.' });
      }
    });
    const input = decisionSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Décision de retrait invalide.');
    }
    return this.cyclesService.reviewWithdrawal(actor, withdrawalRequestId, input.data.decision, input.data.reason);
  }
}