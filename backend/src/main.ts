import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { static as serveStatic, type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import { extname, resolve } from 'node:path';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // API versionnée : toutes les routes publiques sont préfixées /api/v1.
  app.setGlobalPrefix('api/v1');

  // Servir le bundle empaqueté si présent, sinon le build local Vite.
  const adminDirectory = [
    resolve(process.cwd(), 'dist/admin-dashboard'),
    resolve(process.cwd(), '../admin/dist'),
  ].find((directory) => existsSync(resolve(directory, 'index.html')));

  if (adminDirectory) {
    app.use('/admin', serveStatic(adminDirectory, { index: false }));
    app.use('/admin', (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || extname(req.path) !== '') return next();
      res.sendFile(resolve(adminDirectory, 'index.html'), (error) => {
        if (error) next(error);
      });
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API COOPECA démarrée sur http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`Admin Web Dashboard disponible sur http://localhost:${port}/admin`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error('Échec du démarrage de l\'API', error instanceof Error ? error.stack : undefined);
  process.exit(1);
});
