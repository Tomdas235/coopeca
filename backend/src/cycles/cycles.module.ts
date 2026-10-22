import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CyclesController, MarketsController } from './cycles.controller';
import { CyclesService } from './cycles.service';

@Module({
  imports: [AuthModule],
  controllers: [MarketsController, CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}