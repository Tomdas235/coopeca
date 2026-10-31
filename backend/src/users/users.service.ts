import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { AuthenticatedPrincipal } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

export interface UserListItem {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  branchAccesses: string[];
  createdAt: Date;
}

export interface UserDetailResponse {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  branchAccesses: UserBranchAccess[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBranchAccess {
  branchId: string;
  branchCode: string;
  branchName: string;
  isPrimary: boolean;
  marketIds: string[];
}

const USER_SORT_FIELDS = new Set([
  'id',
  'username',
  'fullName',
  'email',
  'phone',
  'role',
  'isActive',
  'createdAt',
]);

const MAX_PAGE_LIMIT = 50;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: AuthenticatedPrincipal, params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
    this.requireAdmin(actor);
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AppUserWhereInput = {};
    if (params.role) where.role = params.role as UserRole;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { username: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.AppUserOrderByWithRelationInput[] = [];
    const sortField = params.sortBy && USER_SORT_FIELDS.has(params.sortBy)
      ? params.sortBy
      : 'createdAt';
    const sortDirection = params.sortOrder === 'desc' ? 'desc' : 'asc';
    orderBy.push({ [sortField]: sortDirection });

    const [items, total] = await Promise.all([
      this.prisma.appUser.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          branchAccesses: {
            select: {
              isPrimary: true,
              marketId: true,
              branch: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.appUser.count({ where }),
    ]);

    return {
      items: items.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        branchAccesses: user.branchAccesses.map(({ isPrimary, marketId, branch }) => ({
          branchId: branch.id,
          branchCode: branch.code,
          branchName: branch.name,
          isPrimary,
          marketIds: marketId ? [marketId] : [],
        })),
        createdAt: user.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(actor: AuthenticatedPrincipal, id: string) {
    this.requireAdmin(actor);
    const user = await this.prisma.appUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branchAccesses: {
          select: {
            isPrimary: true,
            marketId: true,
            branch: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
        phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      branchAccesses: user.branchAccesses.map(({ isPrimary, marketId, branch }) => ({
          branchId: branch.id,
          branchCode: branch.code,
          branchName: branch.name,
          isPrimary,
        marketIds: marketId ? [marketId] : [],
        })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createAgent(
    actor: AuthenticatedPrincipal,
    input: { username: string; fullName: string; phone?: string | null; password: string; branchId: string },
  ) {
    this.requireAdmin(actor);
    const branch = await this.prisma.branch.findUnique({
      where: { id: input.branchId },
      select: { id: true, isActive: true },
    });
    if (!branch?.isActive) throw new BadRequestException('Une agence active est requise.');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.appUser.create({
          data: {
            username: input.username,
            fullName: input.fullName,
            phone: input.phone || null,
            passwordHash: this.hashPassword(input.password),
            role: UserRole.AGENT,
            isActive: true,
            branchAccesses: {
              create: { branchId: branch.id, isPrimary: true, grantedBy: actor.id },
            },
          },
          select: {
            id: true,
            username: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            branchAccesses: {
              select: { isPrimary: true, branch: { select: { id: true, code: true, name: true } } },
            },
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            branchId: branch.id,
            action: 'AGENT_CREATED',
            entityType: 'app_users',
            entityId: user.id,
            afterData: { username: user.username, fullName: user.fullName, role: user.role, branchId: branch.id },
            requestId: randomUUID(),
          },
        });
        return this.serializeUser(user);
      });
    } catch (error) {
      if (this.isPrismaCode(error, 'P2002')) {
        throw new ConflictException('Cet identifiant utilisateur est déjà utilisé.');
      }
      throw error;
    }
  }

  async updateAgent(
    actor: AuthenticatedPrincipal,
    id: string,
    input: { fullName?: string; phone?: string | null; isActive?: boolean },
  ) {
    this.requireAdmin(actor);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.appUser.findUnique({
        where: { id },
        select: { id: true, username: true, fullName: true, phone: true, role: true, isActive: true, branchAccesses: { select: { branchId: true } } },
      });
      if (!current || current.role !== UserRole.AGENT) throw new NotFoundException('Agent introuvable.');

      const updated = await tx.appUser.update({
        where: { id },
        data: { ...input, updatedAt: new Date() },
        select: {
          id: true,
          username: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          branchAccesses: { select: { isPrimary: true, marketId: true, branch: { select: { id: true, code: true, name: true } } } },
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          branchId: current.branchAccesses[0]?.branchId ?? null,
          action: input.isActive === false ? 'AGENT_DEACTIVATED' : input.isActive === true ? 'AGENT_REACTIVATED' : 'AGENT_UPDATED',
          entityType: 'app_users',
          entityId: id,
          beforeData: { fullName: current.fullName, phone: current.phone, isActive: current.isActive },
          afterData: { fullName: updated.fullName, phone: updated.phone, isActive: updated.isActive },
          requestId: randomUUID(),
        },
      });
      return this.serializeUser(updated);
    });
  }

  private serializeUser(user: {
    id: string;
    username: string;
    fullName: string;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    branchAccesses: Array<{ isPrimary: boolean; marketId?: string | null; branch: { id: string; code: string; name: string } }>;
  }) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      branchAccesses: user.branchAccesses.map(({ isPrimary, marketId, branch }) => ({
        branchId: branch.id,
        branchCode: branch.code,
        branchName: branch.name,
        isPrimary,
        marketIds: marketId ? [marketId] : [],
      })),
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16);
    const derivedKey = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    return ['scrypt', 16384, 8, 1, salt.toString('hex'), derivedKey.toString('hex')].join('$');
  }

  private requireAdmin(actor: AuthenticatedPrincipal): void {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Seul un administrateur peut gérer les comptes.');
  }

  private isPrismaCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
  }

}
