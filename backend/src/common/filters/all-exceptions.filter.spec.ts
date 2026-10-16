import { ArgumentsHost, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  const request = { method: 'GET', url: '/api/v1/health' };

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    json = jest.fn();
    status = jest.fn();
    const response = { status, json };
    status.mockReturnValue(response);

    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
  });

  it('restitue tel quel un corps métier explicite (contrat health)', () => {
    const health = {
      status: 'degraded',
      database: 'down',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 1,
    };

    filter.catch(new ServiceUnavailableException(health), host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith(health);
  });

  it('normalise une HttpException standard en enveloppe { statusCode, error, message, path, timestamp }', () => {
    filter.catch(new BadRequestException('champ requis'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'champ requis',
      path: '/api/v1/health',
      timestamp: expect.any(String),
    });
  });

  it("ne restitue jamais le détail d'une erreur interne inconnue", () => {
    filter.catch(new Error('détail interne secret'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Une erreur interne est survenue.',
      path: '/api/v1/health',
    });
    expect(JSON.stringify(body)).not.toContain('détail interne secret');
  });
});