import { getDatabase } from '../db';
import type { StatutDossier, SyncStatus } from '../schema';

export type DossierLocal = {
  id: string;
  reference_provisoire: string;
  client_id: string;
  agence_id: string;
  statut: StatutDossier;
  date_creation_declaree: string;
  cle_idempotence: string;
  sync_status: SyncStatus;
  date_maj: string;
};

/**
 * Repository des dossiers locaux.
 *
 * Règles métier :
 * - Un seul dossier ouvert par client et par agence.
 * - Un dossier créé hors ligne a le statut OUVERT, en attente d'acceptation serveur.
 */
export const dossierRepository = {
  async create(dossier: Omit<DossierLocal, 'id'>): Promise<string> {
    const db = getDatabase();
    const id = dossier.cle_idempotence;
    await db.runAsync(
      `INSERT INTO dossiers (id, reference_provisoire, client_id, agence_id, statut, date_creation_declaree, cle_idempotence, sync_status, date_maj)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dossier.reference_provisoire,
        dossier.client_id,
        dossier.agence_id,
        dossier.statut,
        dossier.date_creation_declaree,
        dossier.cle_idempotence,
        dossier.sync_status,
        dossier.date_maj,
      ],
    );
    return id;
  },

  async findById(id: string): Promise<DossierLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<DossierLocal>(
      'SELECT * FROM dossiers WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findOuvertsByClientEtAgence(
    clientId: string,
    agenceId: string,
  ): Promise<DossierLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<DossierLocal>(
      `SELECT * FROM dossiers 
       WHERE client_id = ? AND agence_id = ? AND statut = 'OUVERT'`,
      [clientId, agenceId],
    );
  },

  async findByAgence(agenceId: string): Promise<DossierLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<DossierLocal>(
      'SELECT * FROM dossiers WHERE agence_id = ?',
      [agenceId],
    );
  },

  async markSynced(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE dossiers SET sync_status = ?, date_maj = ? WHERE id = ?',
      ['SYNCED', new Date().toISOString(), id],
    );
  },

  async markDraft(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE dossiers SET sync_status = ?, date_maj = ? WHERE id = ?',
      ['DRAFT', new Date().toISOString(), id],
    );
  },
};
