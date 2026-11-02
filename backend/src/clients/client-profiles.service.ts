import { Injectable, NotImplementedException } from '@nestjs/common';
import { ClientStatus } from '@prisma/client';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

export interface CreateClientProfileInput {
  firstName: string;
  lastName: string;
  phone: string;
  neighborhood?: string;
  addressDetails?: string;
  branchId: string;
  marketId?: string;
  collectionAgentId?: string;
  deviceId: string;
  clientOperationId: string;
  declaredAt?: string;
}

export interface ListClientProfilesParams {
  page: number;
  limit: number;
  status?: string;
  branchId?: string;
  search?: string;
}

export interface UpdateClientProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  neighborhood?: string;
  addressDetails?: string;
  status?: ClientStatus;
}

export interface CheckDuplicatesParams {
  phone: string;
  firstName: string;
  lastName: string;
  branchId: string;
}

/**
 * Service minimal des profils clients.
 * Les méthodes ne sont pas encore implémentées : elles lèvent NotImplementedException.
 */
@Injectable()
export class ClientProfilesService {
  constructor(protected readonly prisma: PrismaService) {}

  async create(_actor: AuthenticatedPrincipal, _input: CreateClientProfileInput): Promise<unknown> {
    throw new NotImplementedException('ClientProfilesService.create non implémenté.');
  }

  async list(_actor: AuthenticatedPrincipal, _params: ListClientProfilesParams): Promise<unknown> {
    throw new NotImplementedException('ClientProfilesService.list non implémenté.');
  }

  async findOne(_actor: AuthenticatedPrincipal, _id: string): Promise<unknown> {
    throw new NotImplementedException('ClientProfilesService.findOne non implémenté.');
  }

  async update(
    _actor: AuthenticatedPrincipal,
    _id: string,
    _input: UpdateClientProfileInput,
  ): Promise<unknown> {
    throw new NotImplementedException('ClientProfilesService.update non implémenté.');
  }

  async checkDuplicates(_actor: AuthenticatedPrincipal, _params: CheckDuplicatesParams): Promise<unknown> {
    throw new NotImplementedException('ClientProfilesService.checkDuplicates non implémenté.');
  }
}
