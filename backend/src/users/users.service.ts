import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface UserListItem {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
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
  email: string | null;
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

  async findAll(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
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
          updatedAt: true,
          branchAccesses: {
            select: {
              isPrimary: true,
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
        branchAccesses: [],
        createdAt: user.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
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
      branchAccesses: [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

}
