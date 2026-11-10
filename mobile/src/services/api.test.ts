import {
  createClient,
  listClients,
  createDossier,
  depositToCycle,
  ApiError,
} from './api';
import { setAccessToken } from './tokenStore';

describe('mobile API service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setAccessToken('fake-jwt-token');
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('createClient envoie un POST /api/v1/clients avec les données correctes', async () => {
    const mockClientResponse = {
      id: 'client-uuid-1',
      clientCode: 'CLI-123456',
      firstName: 'Jean',
      lastName: 'Kouamé',
      phone: '+22507000000',
      status: 'PROVISIONAL',
      branchId: 'branch-uuid-1',
      marketId: 'market-uuid-1',
      collectionAgentId: 'agent-uuid-1',
      createdAt: '2026-11-03T00:00:00.000Z',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockClientResponse),
    });

    const client = await createClient({
      clientCode: 'CLI-123456',
      firstName: 'Jean',
      lastName: 'Kouamé',
      phone: '+22507000000',
      branchId: 'branch-uuid-1',
      marketId: 'market-uuid-1',
      collectionAgentId: 'agent-uuid-1',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/clients'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-jwt-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          clientCode: 'CLI-123456',
          firstName: 'Jean',
          lastName: 'Kouamé',
          phone: '+22507000000',
          branchId: 'branch-uuid-1',
          marketId: 'market-uuid-1',
          collectionAgentId: 'agent-uuid-1',
        }),
      }),
    );
    expect(client).toEqual(mockClientResponse);
  });

  it('listClients envoie un GET /api/v1/clients avec les paramètres de filtre', async () => {
    const mockList = {
      items: [
        {
          id: 'c-1',
          clientCode: 'CLI-001',
          fullName: 'Jean Kouamé',
          status: 'ACTIVE',
          branchId: 'b-1',
          marketId: 'm-1',
          createdAt: '2026-11-03T00:00:00.000Z',
        },
      ],
      total: 1,
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockList),
    });

    const result = await listClients({ search: 'Kouamé', limit: 20 });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/clients\?search=Kouam%C3%A9&limit=20/),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-jwt-token',
        }),
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].fullName).toBe('Jean Kouamé');
  });

  it('createDossier envoie un POST /api/v1/dossiers', async () => {
    const mockDossier = {
      id: 'dossier-uuid-1',
      dossierNo: 'DOSS-123456',
      localReference: 'LOC-123',
      clientId: 'c-1',
      agentId: 'a-1',
      dailyAmountXaf: '1000',
      status: 'OPEN',
      createdAt: '2026-11-03T00:00:00.000Z',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockDossier),
    });

    const res = await createDossier({
      clientId: 'c-1',
      agentId: 'a-1',
      marketId: 'm-1',
      dailyAmountXaf: '1000',
      deviceId: 'device-test-1',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/dossiers'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          clientId: 'c-1',
          agentId: 'a-1',
          marketId: 'm-1',
          dailyAmountXaf: '1000',
          deviceId: 'device-test-1',
        }),
      }),
    );
    expect(res.dossierNo).toBe('DOSS-123456');
  });

  it('depositToCycle envoie un POST /api/v1/tontine-cycles/:id/deposits avec montant XAF et clé idempotente', async () => {
    const mockDepositResult = {
      transactionId: 'tx-uuid-1',
      replayed: false,
      cycleId: 'cycle-uuid-1',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockDepositResult),
    });

    const res = await depositToCycle('cycle-uuid-1', 1000, 'idempotency-key-uuid-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/tontine-cycles/cycle-uuid-1/deposits'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          amountXaf: '1000',
          idempotencyKey: 'idempotency-key-uuid-1',
        }),
      }),
    );
    expect(res.transactionId).toBe('tx-uuid-1');
  });

  it('lève ApiError avec le message d’erreur serveur en cas de rejet HTTP', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({
        message: 'Ce code client existe déjà pour cette agence.',
      }),
    });

    await expect(
      createClient({
        clientCode: 'CLI-EXISTING',
        firstName: 'A',
        lastName: 'B',
        branchId: 'b-1',
        collectionAgentId: 'a-1',
      }),
    ).rejects.toThrow('Ce code client existe déjà pour cette agence.');
  });
});
