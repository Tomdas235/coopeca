import { getDatabase } from '../db';
import type { BusinessStatusRemise, SyncStatus } from '../schema';

export type RemiseLocal = {
  id: string;
  agence_id: string;
  montant_total_xaf: number;
  statut: BusinessStatusRemise;
  cle_idempotence: string;
  sync_status: SyncStatus;
  date_declaree: string;
  date_confirmee_caisse: string | null;
  motif_ecart: string | null;
  date_maj: string;
};

/**
 * Repository des remises locales.
 *
 * Règles métier :
 * - La déclaration de remise par l'agent n'est pas la confirmation du caissier.
 * - Une collecte ne peut appartenir qu'à une seule remise.
 * - Les écarts passent par une annulation motivée ou une compensation autorisée.
 */
export const remiseRepository = {
  async create(remise: Omit<RemiseLocal, 'id'>): Promise<string> {
    const db = getDatabase();
    const id = remise.cle_idempotence;
    await db.runAsync(
      `INSERT INTO remises (id, agence_id, montant_total_xaf, statut, cle_idempotence, sync_status, date_declaree, date_confirmee_caisse, motif_ecart, date_maj)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        remise.agence_id,
        remise.montant_total_xaf,
        remise.statut,
        remise.cle_idempotence,
        remise.sync_status,
        remise.date_declaree,
        remise.date_confirmee_caisse,
        remise.motif_ecart,
        remise.date_maj,
      ],
    );
    return id;
  },

  async findById(id: string): Promise<RemiseLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<RemiseLocal>(
      'SELECT * FROM remises WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByAgence(agenceId: string): Promise<RemiseLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<RemiseLocal>(
      'SELECT * FROM remises WHERE agence_id = ?',
      [agenceId],
    );
  },

  async confirmerCaisse(
    id: string,
    dateConfirmee: string,
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE remises SET statut = 'CONFIRMÉE', date_confirmee_caisse = ?, date_maj = ? WHERE id = ?`,
      [dateConfirmee, new Date().toISOString(), id],
    );
  },

  async signalerEcart(
    id: string,
    motif: string,
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE remises SET statut = 'ÉCART', motif_ecart = ?, date_maj = ? WHERE id = ?`,
      [motif, new Date().toISOString(), id],
    );
  },

  async annuler(
    id: string,
    motif: string,
  ): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE remises SET statut = 'ANNULÉE', motif_ecart = ?, date_maj = ? WHERE id = ?`,
      [motif, new Date().toISOString(), id],
    );
  },
};
