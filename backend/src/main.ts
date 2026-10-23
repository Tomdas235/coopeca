import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // API versionnée : toutes les routes publiques sont préfixées /api/v1.
  app.setGlobalPrefix('api/v1');

  // Admin Web Dashboard : servir les fichiers statiques
  app.use('/admin', (req, res, next) => {
    express().use(express.static('dist/admin-dashboard', { index: 'index.html' }))(req, res, next);
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API COOPECA démarrée sur http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`Admin Web Dashboard disponible sur http://localhost:${port}/admin`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error('Échec du démarrage de l\'API', error instanceof Error ? error.stack : undefined);
  process.exit(1);
});
