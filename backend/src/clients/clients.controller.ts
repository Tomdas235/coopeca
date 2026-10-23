import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { ClientsService, ClientFilters } from './clients.service';
import { ClientStatus } from '@prisma/client';
const createSchema = z.object({
  clientCode: z.string().min(1).max(40),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(40).nullable().optional(),
  neighborhood: z.string().max(100).nullable().optional(),
  addressDetails: z.string().max(500).nullable().optional(),
  branchId: z.string().uuid(),
  marketId: z.string().uuid().optional(),
  collectionAgentId: z.string().uuid(),
});


const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/).transform(Number).default(1 as unknown as number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').transform(Number).default(20 as unknown as number),
});

const sortSchema = z.object({
  sortBy: z.string().regex(/^(id|clientCode|firstName|lastName|phone|status|createdAt|balanceXaf)$/).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const filterSchema = z.object({
  status: z.nativeEnum(ClientStatus).optional(),
  agencyId: z.string().uuid().optional(),
  marketId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  fromCreatedAt: z.string().datetime({ offset: true }).optional(),
  toCreatedAt: z.string().datetime({ offset: true }).optional(),
});

const updateSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(40).nullable().optional(),
  neighborhood: z.string().max(100).nullable().optional(),
  addressDetails: z.string().max(500).nullable().optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  branchId: z.string().uuid().optional(),
  marketId: z.string().uuid().optional(),
  collectionAgentId: z.string().uuid().optional(),
  rejectionReason: z.string().max(1000).optional(),
  reviewedById: z.string().uuid().optional(),
  reviewedAt: z.string().datetime({ offset: true }).optional(),
});

@Controller('clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(
    @CurrentUser() _actor: AuthenticatedPrincipal,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
    @Query() filters: ClientFilters,
  ) {
    const pageParams = pageSchema.safeParse({ page });
    const limitParams = limitSchema.safeParse({ limit });
    const sortParams = sortSchema.safeParse({ sortBy, sortOrder });
    const filterParams = filterSchema.safeParse(filters);

    if (!pageParams.success || !limitParams.success || !sortParams.success || !filterParams.success) {
      throw new BadRequestException('Paramètres de pagination, tri ou filtres invalides.');
    }

    return this.clientsService.findAll({
      page: pageParams.data.page,
      limit: limitParams.data.limit,
      sortBy: sortParams.data.sortBy,
      sortOrder: sortParams.data.sortOrder,
      filters: filterParams.data,
    });
  }

  @Get(':id')
  getOne(
    @CurrentUser() _actor: AuthenticatedPrincipal,
    @Param('id') id: string,
  ) {
    return this.clientsService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() _actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = createSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données client invalides.');
    }

    return this.clientsService.create(_actor, input.data);
  }

  @Patch(':id')
  update(
    @CurrentUser() _actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de mise à jour invalides.');
    }

    return this.clientsService.update(id, _actor, input.data);
  }

  @Get(':id/balance')
  getBalance(
    @CurrentUser() _actor: AuthenticatedPrincipal,
    @Param('id') id: string,
  ) {
    return { clientId: id, balanceXaf: this.clientsService.getBalance(id).toString() };
  }
}
