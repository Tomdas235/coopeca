import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Les logs Nest n'incluent pas la configuration d'environnement :
    // aucun secret n'y est journalisé par défaut.
    logger: ['error', 'warn', 'log'],
  });

  // API versionnée : toutes les routes publiques sont préfixées /api/v1.
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API COOPECA démarrée sur http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error('Échec du démarrage de l\'API', error instanceof Error ? error.stack : undefined);
  process.exit(1);
});
