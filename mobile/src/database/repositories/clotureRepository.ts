import { getDatabase } from '../db';
import type { BusinessStatusCloture, SyncStatus } from '../schema';

export type ClotureLocal = {
  id: string;
  agent_id: string;
  date_metier: string;
  statut: BusinessStatusCloture;
  total_collectes_xaf: number;
  cle_idempotence: string;
  sync_status: SyncStatus;
  date_declaree: string;
  date_confirmee: string | null;
  motif_reouverture: string | null;
  date_maj: string;
};

/**
 * Repository des clôtures journalières locales.
 *
 * Règles métier :
 * - Une clôture peut être déclarée localement hors ligne.
 * - Elle n'est pas confirmée par le serveur tant que des opérations attendent la synchronisation.
 * - La réouverture est réservée à un superviseur autorisé, avec motif et journal d'audit.
 */
export const clotureRepository = {
  async create(cloture: Omit<ClotureLocal, 'id'>): Promise<string> {
    const db = getDatabase();
    const id = cloture.cle_idempotence;
    await db.runAsync(
      `INSERT INTO clotures (id, agent_id, date_metier, statut, total_collectes_xaf, cle_idempotence, sync_status, date_declaree, date_confirmee, motif_reouverture, date_maj)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cloture.agent_id,
        cloture.date_metier,
        cloture.statut,
        cloture.total_collectes_xaf,
        cloture.cle_idempotence,
        cloture.sync_status,
        cloture.date_declaree,
        cloture.date_confirmee,
        cloture.motif_reouverture,
        cloture.date_maj,
      ],
    );
    return id;
  },

  async findById(id: string): Promise<ClotureLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<ClotureLocal>(
      'SELECT * FROM clotures WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByAgentEtDate(
    agentId: string,
    dateMetier: string,
  ): Promise<ClotureLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<ClotureLocal>(
      'SELECT * FROM clotures WHERE agent_id = ? AND date_metier = ?',
      [agentId, dateMetier],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByAgent(agentId: string): Promise<ClotureLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<ClotureLocal>(
      'SELECT * FROM clotures WHERE agent_id = ? ORDER BY date_metier DESC',
      [agentId],
    );
  },

  async confirmer(id: string, dateConfirmee: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE clotures SET statut = 'CONFIRMÉE', date_confirmee = ?, date_maj = ? WHERE id = ?`,
      [dateConfirmee, new Date().toISOString(), id],
    );
  },

  async rouvrir(
    id: string,
    motif: string,
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE clotures SET statut = 'ROUVERTE', motif_reouverture = ?, date_maj = ? WHERE id = ?`,
      [motif, new Date().toISOString(), id],
    );
  },
};
