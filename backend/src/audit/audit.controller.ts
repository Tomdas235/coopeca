import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { AuditService } from './audit.service';

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/, 'Page invalide.').default('1').transform(Number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').default('50').transform(Number),
});

const dateSchema = z.string().datetime({ offset: true }).optional();

const filterSchema = z.object({
  action: z.string().max(100).optional(),
  entityType: z.string().max(60).optional(),
  entityId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  fromDate: dateSchema,
  toDate: dateSchema,
});

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  list(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query() filters: Record<string, string | undefined>,
  ) {
    const pageParams = pageSchema.safeParse({ page });
    const limitParams = limitSchema.safeParse({ limit });
    const filterParams = filterSchema.safeParse(filters);

    if (!pageParams.success || !limitParams.success || !filterParams.success) {
      throw new BadRequestException('Paramètres de pagination ou filtres invalides.');
    }

    return this.auditService.list(actor, {
      page: pageParams.data.page,
      limit: limitParams.data.limit,
      action: filterParams.data.action,
      entityType: filterParams.data.entityType,
      entityId: filterParams.data.entityId,
      branchId: filterParams.data.branchId,
      fromDate: filterParams.data.fromDate,
      toDate: filterParams.data.toDate,
    });
  }
}