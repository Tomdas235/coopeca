import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Module « health » — endpoints d'infrastructure (santé de l'API et de la base).
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
