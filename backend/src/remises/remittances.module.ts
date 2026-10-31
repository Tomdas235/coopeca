import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RemittancesController } from './remittances.controller';
import { RemittancesService } from './remittances.service';

@Module({
  imports: [AuthModule],
  controllers: [RemittancesController],
  providers: [RemittancesService],
  exports: [RemittancesService],
})
export class RemittancesModule {}
