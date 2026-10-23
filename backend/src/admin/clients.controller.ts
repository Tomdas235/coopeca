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
import { ClientsService } from './clients.service';

const uuid = z.string().uuid();

const clientSchema = z
  .object({
    clientId: uuid,
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().optional(),
  })
  .strict();

const clientStatusUpdateSchema = z.object({
  status: z.enum(['PROVISIONAL', 'ACTIVE', 'REJECTED', 'ARCHIVED']),
});

@Controller('admin/clients')
@UseGuards(AuthGuard)
export class AdminClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedPrincipal) {
    return this.clientsService.listClients(actor);
  }

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Body() body: unknown,
  ) {
    const input = clientSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Données client invalides.');
    return this.clientsService.createClient(actor, input.data);
  }

  @Post(':clientId/status')
  updateStatus(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('clientId') clientId: string,
    @Body() body: unknown,
  ) {
    const id = uuid.safeParse(clientId);
    const input = clientStatusUpdateSchema.safeParse(body);
    if (!id.success || !input.success)
      throw new BadRequestException('Client et statut valides requis.');
    return this.clientsService.updateClientStatus(actor, clientId, input.data.status);
  }
}