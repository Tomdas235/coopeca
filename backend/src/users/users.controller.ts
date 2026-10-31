import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { UsersService } from './users.service';

const uuidSchema = z.string().uuid();
const listQuerySchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/).default('1').transform(Number),
  limit: z.string().regex(/^[1-9]\d{0,1}$/).default('20').transform(Number),
  search: z.string().trim().max(100).optional(),
  role: z.enum(['AGENT', 'CASHIER', 'SUPERVISOR', 'ACCOUNTANT', 'ADMIN', 'AUDITOR']).optional(),
});

const createAgentSchema = z.object({
  username: z.string().trim().min(1).max(80),
  fullName: z.string().trim().min(1).max(180),
  phone: z.string().trim().max(40).optional().nullable(),
  password: z.string().min(8).max(256),
  branchId: uuidSchema,
}).strict();

const updateAgentSchema = z.object({
  fullName: z.string().trim().min(1).max(180).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query() query: unknown,
  ) {
    const params = listQuerySchema.safeParse(query);
    if (!params.success) throw new BadRequestException('Filtres de recherche invalides.');
    return this.usersService.findAll(actor, params.data);
  }

  @Post('agents')
  createAgent(@CurrentUser() actor: AuthenticatedPrincipal, @Body() body: unknown) {
    const input = createAgentSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Informations de création agent invalides.');
    return this.usersService.createAgent(actor, input.data);
  }

  @Patch(':id')
  updateAgent(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsedId = uuidSchema.safeParse(id);
    const input = updateAgentSchema.safeParse(body);
    if (!parsedId.success || !input.success) {
      throw new BadRequestException('Identifiant ou informations agent invalides.');
    }
    return this.usersService.updateAgent(actor, id, input.data);
  }

  @Get(':id')
  async findOne(@CurrentUser() actor: AuthenticatedPrincipal, @Param('id') id: string) {
    if (!uuidSchema.safeParse(id).success) throw new BadRequestException('Identifiant utilisateur invalide.');
    return this.usersService.findOne(actor, id);
  }
}