import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService, HealthStatus } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  const serviceMock: jest.Mocked<HealthService> = {
    getHealth: jest.fn(),
  } as unknown as jest.Mocked<HealthService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(HealthController);
    jest.clearAllMocks();
  });

  it('retourne un statut « ok » lorsque la base répond', async () => {
    const health: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 1,
      database: 'up',
    };
    serviceMock.getHealth.mockResolvedValue(health);

    await expect(controller.check()).resolves.toEqual(health);
    expect(serviceMock.getHealth).toHaveBeenCalledTimes(1);
  });

  it('throw ServiceUnavailableException lorsque la base est injoignable', async () => {
    const health: HealthStatus = {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 1,
      database: 'down',
    };
    serviceMock.getHealth.mockResolvedValue(health);

    await expect(controller.check()).rejects.toMatchObject({
      status: 503,
      message: health,
    });
  });
});
