import { Module } from '@nestjs/common';
import { AdminCyclesController } from '../cycles.controller';
import { AdminCyclesService } from '../cycles.service';

@Module({
  controllers: [AdminCyclesController],
  providers: [AdminCyclesService],
  exports: [AdminCyclesService],
})
export class CyclesModule {}