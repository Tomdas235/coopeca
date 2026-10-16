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
 * - jamais de secret ni d'URL de base de données dans la réponse ou le log.
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

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const body = exResponse as Record<string, unknown>;
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
      // Log interne uniquement : le message est conservé côté serveur pour
      // le diagnostic, sans être restitué au client en production.
      this.logger.error(
        `Erreur non gérée sur ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
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
