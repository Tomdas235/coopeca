import { BadRequestException } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuthenticatedPrincipal } from '../auth/auth.types';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: jest.Mocked<AuditService>;

  const mockActor: AuthenticatedPrincipal = {
    id: 'user-uuid-1',
    username: 'auditor1',
    fullName: 'Auditeur Principal',
    role: 'AUDITOR',
    branches: [
      {
        id: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
        code: 'BR-1',
        name: 'Agence Centrale',
        isPrimary: true,
      },
    ],
  };

  beforeEach(() => {
    auditService = {
      list: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    controller = new AuditController(auditService);
  });

  it('appelle auditService.list avec les valeurs par défaut lorsque aucun paramètre n\'est fourni', async () => {
    const mockResult = {
      items: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    };
    auditService.list.mockResolvedValue(mockResult);

    const result = await controller.list(mockActor, undefined, undefined, {});

    expect(auditService.list).toHaveBeenCalledWith(mockActor, {
      page: 1,
      limit: 50,
      action: undefined,
      entityType: undefined,
      entityId: undefined,
      branchId: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
    expect(result).toEqual(mockResult);
  });

  it('appelle auditService.list avec des filtres et pagination valides', async () => {
    const mockResult = {
      items: [],
      total: 1,
      page: 2,
      limit: 25,
      totalPages: 1,
    };
    auditService.list.mockResolvedValue(mockResult);

    const filters = {
      action: 'CYCLE_OPENED',
      entityType: 'Cycle',
      entityId: 'e2a8be98-5c02-4ec4-913a-44eefea237a6',
      branchId: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
      fromDate: '2026-11-01T00:00:00.000Z',
      toDate: '2026-11-02T23:59:59.000Z',
    };

    const result = await controller.list(mockActor, '2', '25', filters);

    expect(auditService.list).toHaveBeenCalledWith(mockActor, {
      page: 2,
      limit: 25,
      action: 'CYCLE_OPENED',
      entityType: 'Cycle',
      entityId: 'e2a8be98-5c02-4ec4-913a-44eefea237a6',
      branchId: '981e2a14-8b91-42cf-a392-9ec47aaef0c5',
      fromDate: '2026-11-01T00:00:00.000Z',
      toDate: '2026-11-02T23:59:59.000Z',
    });
    expect(result).toEqual(mockResult);
  });

  it('rejette une page invalide avec BadRequestException', async () => {
    expect(() => controller.list(mockActor, '0', '10', {})).toThrow(BadRequestException);
    expect(() => controller.list(mockActor, '-5', '10', {})).toThrow(BadRequestException);
    expect(() => controller.list(mockActor, 'abc', '10', {})).toThrow(BadRequestException);
    expect(auditService.list).not.toHaveBeenCalled();
  });

  it('rejette une limite invalide avec BadRequestException', async () => {
    expect(() => controller.list(mockActor, '1', '0', {})).toThrow(BadRequestException);
    expect(() => controller.list(mockActor, '1', '101', {})).toThrow(BadRequestException);
    expect(auditService.list).not.toHaveBeenCalled();
  });

  it('rejette des filtres invalides (ex: UUID ou date mal formés) avec BadRequestException', async () => {
    expect(() =>
      controller.list(mockActor, '1', '20', { entityId: 'invalid-not-uuid' }),
    ).toThrow(BadRequestException);

    expect(() =>
      controller.list(mockActor, '1', '20', { branchId: 'invalid-not-uuid' }),
    ).toThrow(BadRequestException);

    expect(() =>
      controller.list(mockActor, '1', '20', { fromDate: 'not-a-valid-date' }),
    ).toThrow(BadRequestException);

    expect(auditService.list).not.toHaveBeenCalled();
  });
});
