import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

/**
 * Module global « common » : composants transverses (filtres, pipes, guards).
 * Aucune logique métier ici.
 */
@Global()
@Module({
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
  exports: [],
})
export class CommonModule {}
