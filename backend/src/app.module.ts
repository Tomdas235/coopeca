import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CyclesModule } from './cycles/cycles.module';
import { ClientsModule } from './clients/clients.module';
import { RemittancesModule } from './remises/remittances.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { DossiersModule } from './dossiers/dossiers.module';
import { SynchronisationModule } from './synchronisation/synchronisation.module';
import { ClientProfilesModule } from './clients/client-profiles.module';
import { AuditModule } from './audit/audit.module';
import { SystemSettingModule } from './config/system-setting.module';
import { ClosuresModule } from './clotures/closures.module';

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
      envFilePath: ['backend/.env'],
      load: [configuration],
      validate: validateEnv,
      cache: true,
    }),
    CommonModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    CyclesModule,
    ClientsModule,
    RemittancesModule,
    UsersModule,
    BranchesModule,
    DossiersModule,
    SynchronisationModule,
    ClientProfilesModule,
    ClosuresModule,
    AuditModule,
    SystemSettingModule,
  ],
})
export class AppModule {}

/** Type de la configuration nominative (pour consommation typée). */
export type AppConfigType = ConfigType<typeof configuration>;
