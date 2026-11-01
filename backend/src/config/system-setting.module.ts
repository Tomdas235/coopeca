import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SystemSettingController } from './system-setting.controller';
import { SystemSettingService } from './system-setting.service';

@Module({
  imports: [AuthModule],
  controllers: [SystemSettingController],
  providers: [SystemSettingService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}