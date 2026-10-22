import { getDatabase } from '../db';
import type { StatutClient, SyncStatus } from '../schema';

export type ClientLocal = {
  id: string;
  nom: string;
  prenom: string;
  telephone_normalise: string;
  statut: StatutClient;
  agence_id: string;
  date_creation_declaree: string;
  doublon_potentiel: boolean;
  cle_idempotence: string;
  sync_status: SyncStatus;
  date_maj: string;
};

/**
 * Repository des clients locaux.
 *
 * Règles métier :
 * - Un client créé hors ligne a le statut PROVISOIRE jusqu'à acceptation serveur.
 * - Un doublon potentiel (téléphone normalisé + nom/prénom dans la même agence)
 *   déclenche une revue, jamais une fusion automatique.
 */
export const clientRepository = {
  async create(client: Omit<ClientLocal, 'id'>): Promise<string> {
    const db = getDatabase();
    const id = client.cle_idempotence;
    await db.runAsync(
      `INSERT INTO clients (id, nom, prenom, telephone_normalise, statut, agence_id, date_creation_declaree, doublon_potentiel, cle_idempotence, sync_status, date_maj)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        client.nom,
        client.prenom,
        client.telephone_normalise,
        client.statut,
        client.agence_id,
        client.date_creation_declaree,
        client.doublon_potentiel ? 1 : 0,
        client.cle_idempotence,
        client.sync_status,
        client.date_maj,
      ],
    );
    return id;
  },

  async findById(id: string): Promise<ClientLocal | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<ClientLocal>(
      'SELECT * FROM clients WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByAgence(agenceId: string): Promise<ClientLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<ClientLocal>(
      'SELECT * FROM clients WHERE agence_id = ?',
      [agenceId],
    );
  },

  async findDoublonsPotentiels(
    agenceId: string,
    telephoneNormalise: string,
    nom: string,
    prenom: string,
  ): Promise<ClientLocal[]> {
    const db = getDatabase();
    return db.getAllAsync<ClientLocal>(
      `SELECT * FROM clients 
       WHERE agence_id = ? 
         AND telephone_normalise = ? 
         AND nom = ? 
         AND prenom = ? 
         AND doublon_potentiel = 1`,
      [agenceId, telephoneNormalise, nom, prenom],
    );
  },

  async markSynced(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE clients SET sync_status = ?, date_maj = ? WHERE id = ?',
      ['SYNCED', new Date().toISOString(), id],
    );
  },

  async markDraft(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE clients SET sync_status = ?, date_maj = ? WHERE id = ?',
      ['DRAFT', new Date().toISOString(), id],
    );
  },
};
