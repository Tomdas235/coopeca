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
import { ClosuresService } from './closures.service';

const uuid = z.string().uuid();

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/, 'Page invalide.').default('1').transform(Number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').default('20').transform(Number),
});

const createClosureSchema = z.object({
  businessDate: z.coerce.date().optional(),
  declaredCollectionTotalXaf: z.string().regex(/^\d+$/).transform((v) => BigInt(v)),
  declaredRemittanceTotalXaf: z.string().regex(/^\d+$/).transform((v) => BigInt(v)),
  collectionCount: z.number().int().min(0).default(0),
  deviceId: z.string().trim().min(1).max(120),
}).strict();

const reviewClosureSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().max(1000).optional(),
}).strict().superRefine((value, context) => {
  if (value.decision === 'REJECT' && !value.reviewNote?.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['reviewNote'], message: 'Un motif est requis pour rejeter la clôture.' });
  }
});

const reopenClosureSchema = z.object({
  reason: z.string().trim().min(1).max(1000, 'Motif requis pour la réouverture.'),
}).strict();

@Controller('closures')
@UseGuards(AuthGuard)
export class ClosuresController {
  constructor(private readonly closuresService: ClosuresService) {}

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = createClosureSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de clôture invalides.');
    }
    return this.closuresService.create(actor, input.data);
  }

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('branchId') branchId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate') toDate: string | undefined,
  ) {
    const pageParams = pageSchema.safeParse({ page });
    const limitParams = limitSchema.safeParse({ limit });

    if (!pageParams.success || !limitParams.success) {
      throw new BadRequestException('Paramètres de pagination invalides.');
    }

    return this.closuresService.list(actor, {
      page: pageParams.data.page,
      limit: limitParams.data.limit,
      branchId,
      status,
      fromDate,
      toDate,
    });
  }

  @Patch(':id/review')
  review(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de clôture invalide.');
    }
    const input = reviewClosureSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Décision de clôture invalide.');
    }
    return this.closuresService.review(actor, id, input.data.decision, input.data.reviewNote);
  }

  @Patch(':id/reopen')
  reopen(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de clôture invalide.');
    }
    const input = reopenClosureSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Motif de réouverture requis.');
    }
    return this.closuresService.reopen(actor, id, input.data.reason);
  }
}