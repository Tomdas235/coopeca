import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

/**
 * Module racine de l'API COOPECA.
 *
 * État actuel : squelette technique (health, config, database).
 * Les modules métier (auth, users, agencies, clients, dossiers, collectes,
 * recus, remises, clotures, synchronisation, audit) seront ajoutés après
 * revue du modèle de données — aucune logique métier implémentée ici.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [configuration],
      validate: validateEnv,
      cache: true,
    }),
    CommonModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}

/** Type de la configuration nominative (pour consommation typée). */
export type AppConfigType = ConfigType<typeof configuration>;
