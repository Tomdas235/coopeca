import { Module } from '@nestjs/common';
import { AdminClientsController } from '../clients.controller';
import { AdminClientsService } from '../clients.service';

@Module({
  controllers: [AdminClientsController],
  providers: [AdminClientsService],
  exports: [AdminClientsService],
})
export class ClientsModule {}