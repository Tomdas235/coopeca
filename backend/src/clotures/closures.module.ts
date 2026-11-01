import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClosuresController } from './closures.controller';
import { ClosuresService } from './closures.service';

@Module({
  imports: [AuthModule],
  controllers: [ClosuresController],
  providers: [ClosuresService],
  exports: [ClosuresService],
})
export class ClosuresModule {}