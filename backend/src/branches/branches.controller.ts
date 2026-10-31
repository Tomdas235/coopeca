import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { BranchesService } from './branches.service';

const uuidSchema = z.string().uuid();
const createBranchSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  marketId: uuidSchema,
}).strict();

const updateBranchSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  address: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

@Controller('branches')
@UseGuards(AuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedPrincipal) {
    return this.branchesService.findAll(actor);
  }

  @Post()
  create(@CurrentUser() actor: AuthenticatedPrincipal, @Body() body: unknown) {
    const input = createBranchSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Code, nom et marché valides requis.');
    return this.branchesService.create(actor, input.data);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsedId = uuidSchema.safeParse(id);
    const input = updateBranchSchema.safeParse(body);
    if (!parsedId.success || !input.success) {
      throw new BadRequestException('Identifiant ou informations d’agence invalides.');
    }
    return this.branchesService.update(actor, id, input.data);
  }
}