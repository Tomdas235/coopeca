import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module global « database » : fournit PrismaService à l'ensemble de l'API.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
