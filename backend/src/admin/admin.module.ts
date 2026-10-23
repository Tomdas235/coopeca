import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import configuration from '../config/configuration';
import { validateEnv } from '../config/env.validation';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { MarketsModule } from './markets/markets.module';
import { ClientsModule } from './clients/clients.module';
import { CyclesModule } from './cycles/cycles.module';

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
    MarketsModule,
    ClientsModule,
    CyclesModule,
  ],
})
export class AdminModule {}