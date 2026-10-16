import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service Prisma — point d'accès unique à la base de données.
 *
 * État actuel : squelette technique. Aucun modèle métier n'est défini dans
 * schema.prisma ; aucune migration n'est appliquée à cette étape. Les
 * requêtes démarreront après revue du modèle de données (cf. docs).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connexion PostgreSQL établie (Prisma).');
    } catch (error) {
      // Le squelette doit pouvoir démarrer sans base disponible :
      // la configuration est validée, la connexion sera rétablie au
      // prochain usage par Prisma. L'erreur ne contient pas de secret.
      this.logger.warn(
        'PostgreSQL indisponible au démarrage — les requêtes échoueront tant que la base ne sera pas joignable.',
      );
      this.logger.debug(error instanceof Error ? error.message : String(error));
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
