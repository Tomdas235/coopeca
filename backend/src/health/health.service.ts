import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  database: 'up' | 'down';
}

/**
 * Indicateur de santé de l'application.
 *
 * « up » = la connexion Prisma répond. « down » = la base est injoignable.
 * L'endpoint health est un indicateur d'infrastructure uniquement : il ne
 * porte aucune logique métier et ne prouve pas l'existence de migrations.
 */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthStatus> {
    const database = await this.checkDatabase();
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database,
    };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}
