import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre d'exceptions global.
 *
 * Centralise la forme des réponses d'erreur de l'API :
 *   { statusCode, error, message, path, timestamp }
 *
 * Règles :
 * - jamais de détail interne non maîtrisé (aucun dump de configuration) ;
 * - jamais de secret ni d'URL de base de données dans la réponse ou le log ;
 * - un corps métier explicite fourni par une HttpException (contrat documenté,
 *   par exemple l'objet de santé de GET /api/v1/health) est restitué tel quel.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Une erreur interne est survenue.';
    let isHttpException = false;

    if (exception instanceof HttpException) {
      isHttpException = true;
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (Array.isArray(exResponse)) {
        message = exResponse as string[];
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const body = exResponse as Record<string, unknown>;
        const isStandardShape =
          'statusCode' in body || 'message' in body || 'error' in body;

        if (!isStandardShape) {
          // Corps métier explicite : restitué exactement tel quel, sans y
          // ajouter ni retirer de champ (contrat documenté du consommateur).
          if (status >= 500) {
            this.logger.error(
              `Erreur HTTP ${status} sur ${request.method} ${request.url}: ${JSON.stringify(body)}`,
            );
          } else {
            this.logger.warn(
              `${request.method} ${request.url} -> ${status}: corps métier personnalisé`,
            );
          }
          response.status(status).json(body);
          return;
        }

        if (typeof body.message === 'string' || Array.isArray(body.message)) {
          message = body.message as string | string[];
        }
        if (typeof body.error === 'string') {
          error = body.error;
        }
      }

      if (status < 500) {
        this.logger.warn(
          `${request.method} ${request.url} -> ${status}: ${JSON.stringify(message)}`,
        );
      }
    }

    if (status >= 500) {
      if (isHttpException) {
        // Exception HTTP connue : le message maîtrisé est journalisé, la
        // réponse reste l'enveloppe standard sans détail interne.
        this.logger.error(
          `Erreur HTTP ${status} sur ${request.method} ${request.url}: ${JSON.stringify(message)}`,
        );
      } else {
        // Log interne uniquement : le message est conservé côté serveur pour
        // le diagnostic, sans être restitué au client en production.
        this.logger.error(
          `Erreur non gérée sur ${request.method} ${request.url}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
