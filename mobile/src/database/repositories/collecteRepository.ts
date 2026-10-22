import { getDatabase } from '../db';
import type { BusinessStatusCollecte, PrintStatus, SyncStatus } from '../schema';

export type CollecteLocal = {
  id: string;
  reference_provisoire: string;
  client_receipt_no: string | null;
  dossier_id: string;
  client_id: string;
  montant_xaf: number;
  date_heure_declaree: string;
  statut: BusinessStatusCollecte;
  cle_idempotence: string;
  sync_status: SyncStatus;
  print_status: PrintStatus;
  date_maj: string;
};

/**
 * Repository des collectes locales.
 *
 * Règles métier :
 * - Une collecte référence un dossier ; le client est dérivé du dossier.
 * - Montant en entier XAF, jamais de flottant.
 * - Référence provisoire locale ; numéro officiel alloué par le serveur.
 * - Trois axes d'état : sync / métier / impression.
 */
export const collecteRepository = {
  async create(collecte: Omit<CollecteLocal, 'id'>): Promise<string> {
    const db = getDatabase();
    const id = collecte.cle_idempotence;
    await db.runAsync(
      `INSERT INTO collectes (id, reference_provisoire, client_receipt_no, dossier_id, client_id, montant_xaf, date_heure_declaree, statut, cle_idempotence, sync_status, print_status, date_maj)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        collecte.reference_provisoire,
        collecte.client_receipt_no,
        collecte.dossier_id,
        collecte.client_id,
        collecte.montant_xaf,
        collecte.date_heure_declaree,
        collecte.statut,
        collecte.cle_idempotence,
        collecte.sync_status,
        collecte.print_status,
        collecte.date_maj,
      ],
    );
    return id;
  },

  async findById(id: string): Promise<CollecteLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CollecteLocal>(
      'SELECT * FROM collectes WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByDossier(dossierId: string): Promise<CollecteLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<CollecteLocal>(
      'SELECT * FROM collectes WHERE dossier_id = ?',
      [dossierId],
    );
  },

  async findNonRemises(agenceId: string): Promise<CollecteLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<CollecteLocal>(
      `SELECT c.* FROM collectes c
       LEFT JOIN collecte_remise cr ON c.id = cr.collecte_id
       WHERE c.client_id IN (SELECT id FROM clients WHERE agence_id = ?)
         AND cr.collecte_id IS NULL
         AND c.statut IN ('ACCEPTÉE', 'ENREGISTRÉE_LOCAL')`,
      [agenceId],
    );
  },

  async markSynced(id: string, clientReceiptNo: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE collectes SET client_receipt_no = ?, statut = 'ACCEPTÉE', sync_status = 'SYNCED', date_maj = ? WHERE id = ?`,
      [clientReceiptNo, new Date().toISOString(), id],
    );
  },

  async markRejeté(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE collectes SET statut = 'REJETÉE', sync_status = 'CONFLICT', date_maj = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  },

  async markPrinted(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE collectes SET print_status = 'IMPRIMÉ', date_maj = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  },
};
