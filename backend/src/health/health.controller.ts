import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService, HealthStatus } from './health.service';

/**
 * Contrôleur de santé — GET /api/v1/health
 *
 * Retourne 200 si l'API et la base répondent, 503 si la base est injoignable.
 * Cet endpoint est public (monitoring) et ne donne accès à aucune donnée.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthStatus> {
    const health = await this.healthService.getHealth();
    if (health.status !== 'ok') {
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}
