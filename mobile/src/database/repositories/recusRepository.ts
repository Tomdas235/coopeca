import { getDatabase } from '../db';
import type { PrintStatus, SyncStatus } from '../schema';

export type RecuLocal = {
  id: string;
  collecte_id: string;
  reference_provisoire: string;
  client_receipt_no: string | null;
  statut_impression: PrintStatus;
  date_impression: string | null;
  cle_idempotence: string;
  sync_status: SyncStatus;
  date_maj: string;
};

/**
 * Repository des reçus locaux.
 *
 * Règles métier :
 * - Référence provisoire + numéro officiel (alloué serveur).
 * - Un reçu en attente de synchronisation doit être clairement identifié.
 * - Les copies et réimpressions doivent conserver la traçabilité.
 */
export const recusRepository = {
  async create(recu: Omit<RecuLocal, 'id'>): Promise<string> {
    const db = getDatabase();
    const id = recu.cle_idempotence;
    await db.runAsync(
      `INSERT INTO recus (id, collecte_id, reference_provisoire, client_receipt_no, statut_impression, date_impression, cle_idempotence, sync_status, date_maj)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        recu.collecte_id,
        recu.reference_provisoire,
        recu.client_receipt_no,
        recu.statut_impression,
        recu.date_impression,
        recu.cle_idempotence,
        recu.sync_status,
        recu.date_maj,
      ],
    );
    return id;
  },

  async findById(id: string): Promise<RecuLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<RecuLocal>(
      'SELECT * FROM recus WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByCollecte(collecteId: string): Promise<RecuLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<RecuLocal>(
      'SELECT * FROM recus WHERE collecte_id = ?',
      [collecteId],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async markPrinted(id: string, dateImpression: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE recus SET statut_impression = 'IMPRIMÉ', date_impression = ?, date_maj = ? WHERE id = ?`,
      [dateImpression, new Date().toISOString(), id],
    );
  },

  async markSynced(
    id: string,
    clientReceiptNo: string,
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE recus SET client_receipt_no = ?, sync_status = 'SYNCED', date_maj = ? WHERE id = ?`,
      [clientReceiptNo, new Date().toISOString(), id],
    );
  },
};
