import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientProfilesController } from './client-profiles.controller';
import { ClientProfilesService } from './client-profiles.service';

@Module({
  imports: [AuthModule],
  controllers: [ClientProfilesController],
  providers: [ClientProfilesService],
  exports: [ClientProfilesService],
})
export class ClientProfilesModule {}