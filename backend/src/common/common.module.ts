import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ReferenceService } from './reference.service';

/**
 * Module global « common » : composants transverses (filtres, pipes, guards).
 * Aucune logique métier ici, sauf la génération de références métier.
 */
@Global()
@Module({
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }, ReferenceService],
  exports: [ReferenceService],
})
export class CommonModule {}
