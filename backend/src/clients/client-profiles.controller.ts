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
import { ClientProfilesService } from './client-profiles.service';

const uuid = z.string().uuid();

const pageSchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/, 'Page invalide.').default('1').transform(Number),
});

const limitSchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,1}$/, 'Limite max: 100.').default('20').transform(Number),
});

const createClientSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(40),
  neighborhood: z.string().trim().max(160).optional(),
  addressDetails: z.string().trim().max(500).optional(),
  branchId: uuid,
  marketId: uuid.optional(),
  collectionAgentId: uuid.optional(),
  deviceId: z.string().trim().min(1).max(120),
  clientOperationId: uuid,
  declaredAt: z.string().datetime({ offset: true }).optional(),
}).strict();

const updateClientSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  neighborhood: z.string().trim().max(160).optional(),
  addressDetails: z.string().trim().max(500).optional(),
  status: z.enum(['PROVISIONAL', 'ACTIVE', 'REJECTED', 'ARCHIVED']).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Au moins un champ doit être fourni.',
});

@Controller('clients/profiles')
@UseGuards(AuthGuard)
export class ClientProfilesController {
  constructor(private readonly clientProfilesService: ClientProfilesService) {}

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = createClientSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de client invalides.');
    }
    return this.clientProfilesService.create(actor, input.data);
  }

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query() query: unknown,
  ) {
    const pageParams = pageSchema.safeParse({ page: (query as any)?.page });
    const limitParams = limitSchema.safeParse({ limit: (query as any)?.limit });
    const status = (query as any)?.status;
    const branchId = (query as any)?.branchId;
    const search = (query as any)?.search;

    if (!pageParams.success || !limitParams.success) {
      throw new BadRequestException('Paramètres de pagination invalides.');
    }

    return this.clientProfilesService.list(actor, {
      page: pageParams.data.page,
      limit: limitParams.data.limit,
      status,
      branchId,
      search,
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de client invalide.');
    }
    return this.clientProfilesService.findOne(actor, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!uuid.safeParse(id).success) {
      throw new BadRequestException('Identifiant de client invalide.');
    }
    const input = updateClientSchema.safeParse(body);
    if (!input.success) {
      throw new BadRequestException('Données de mise à jour invalides.');
    }
    return this.clientProfilesService.update(actor, id, input.data);
  }

  @Get('doublons')
  checkDuplicates(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query() query: unknown,
  ) {
    const phone = (query as any)?.phone;
    const firstName = (query as any)?.firstName;
    const lastName = (query as any)?.lastName;
    const branchId = (query as any)?.branchId;

    if (!phone || !firstName || !lastName || !branchId) {
      throw new BadRequestException('Téléphone, prénom, nom et agence requis.');
    }

    if (!uuid.safeParse(branchId).success) {
      throw new BadRequestException('Identifiant d\'agence invalide.');
    }

    return this.clientProfilesService.checkDuplicates(actor, {
      phone,
      firstName,
      lastName,
      branchId,
    });
  }
}