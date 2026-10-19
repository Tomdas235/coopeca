import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * Test end-to-end du health check.
 *
 * La configuration de test fournit volontairement une URL PostgreSQL
 * locale factice : ce test vérifie le contrat HTTP de l'endpoint et la
 * réponse dégradée (503) lorsque la base est injoignable, sans se
 * connecter à aucune base réelle.
 */
describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://coopeca:coopeca_dev_password@127.0.0.1:5499/coopeca?schema=public&sslmode=disable';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health répond avec le contrat attendu (200 ok ou 503 degraded)', async () => {
    // Sans base disponible, l'endpoint doit répondre 503 « degraded » :
    // c'est le comportement attendu du squelette, pas un échec de test.
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toMatchObject({
      status: response.status === 200 ? 'ok' : 'degraded',
      database: response.status === 200 ? 'up' : 'down',
    });
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('renvoie le format d\'erreur standardisé sur une route inexistante', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/route-inexistante')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/api/v1/route-inexistante',
    });
    expect(response.body).toHaveProperty('timestamp');
  });
});
