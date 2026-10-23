import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMarkets(_actor: any) {
    return this.prisma.market.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, code: true, name: true, isActive: true, createdAt: true },
    });
  }

  async createMarket(_actor: any, input: { code: string; name: string }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const market = await tx.market.create({
          data: { code: input.code, name: input.name },
          select: { id: true, code: true, name: true, isActive: true, createdAt: true },
        });
        return market;
      });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new BadRequestException({ code: 'MARCHE_CODE_DEJA_UTILISE', message: 'Ce code marché existe déjà.' });
      }
      throw error;
    }
  }

  private requireRole(actor: any, allowed: string[]) {
    if (!allowed.includes(actor?.role)) {
      throw new ForbiddenException('Action non autorisée pour ce rôle.');
    }
  }
}