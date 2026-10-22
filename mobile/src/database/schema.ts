/**
 * Schéma de la base de données LOCALE (SQLite, via expo-sqlite).
 *
 * Conformément à DECISIONS_VALIDÉES_FRONTEND.md (décision n°7), ce schéma
 * définit les tables locales nécessaires au fonctionnement hors ligne du
 * mobile COOPECA.
 *
 * Règles respectées :
 * - Montants en entiers XAF, jamais de flottants (AGENTS.md §4.7).
 * - Client créé hors ligne = statut PROVISOIRE (DECISIONS_VALIDÉES_FRONTEND §1).
 * - Un seul dossier ouvert par client et par agence (DECISIONS_VALIDÉES_FRONTEND §1).
 * - Référence provisoire générée localement ; numéro officiel alloué serveur (DECISIONS_VALIDÉES_FRONTEND §2).
 * - Trois axes d'état indépendants : sync / métier / impression (DECISIONS_VALIDÉES_FRONTEND §3).
 * - Idempotence : clé d'idempotence sur chaque opération (DECISIONS_VALIDÉES_FRONTEND §5).
 * - Aucune modification du schéma SQL serveur v1.1 n'est effectuée ici.
 */

/** Décrit une migration versionnée de la base locale. */
export interface MigrationLocale {
  /** Numéro de version appliqué par cette migration (strictement croissant). */
  readonly version: number;
  /** Libellé court de la migration. */
  readonly nom: string;
}

/** Registre des migrations locales. */
export const migrations: readonly MigrationLocale[] = [
  { version: 1, nom: 'Schéma initial : clients, dossiers, collectes, remises, clotures, recus' },
];

/** Version courante du schéma local (= dernière migration appliquée). */
export const SCHEMA_VERSION = migrations.length > 0 ? migrations[migrations.length - 1]!.version : 0;

/** Énumérations partagées avec le schéma SQL serveur pour cohérence. */
export enum StatutClient {
  PROVISOIRE = 'PROVISOIRE',
  CONFIRME = 'CONFIRME',
}

export enum StatutDossier {
  OUVERT = 'OUVERT',
  FERME = 'FERME',
  REJETE = 'REJETE',
}

export enum SyncStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
  ERROR = 'ERROR',
}

export enum BusinessStatusCollecte {
  BROUILLON = 'BROUILLON',
  ENREGISTRÉE_LOCAL = 'ENREGISTRÉE_LOCAL',
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTÉE = 'ACCEPTÉE',
  REJETÉE = 'REJETÉE',
  CONFLIT = 'CONFLIT',
}

export enum BusinessStatusRemise {
  DÉCLARÉE = 'DÉCLARÉE',
  EN_ATTENTE_CAISSIER = 'EN_ATTENTE_CAISSIER',
  CONFIRMÉE = 'CONFIRMÉE',
  ÉCART = 'ÉCART',
  ANNULÉE = 'ANNULÉE',
}

export enum BusinessStatusCloture {
  DÉCLARÉE_LOCAL = 'DÉCLARÉE_LOCAL',
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMÉE = 'CONFIRMÉE',
  ROUVERTE = 'ROUVERTE',
}

export enum PrintStatus {
  NON_IMPRIMÉ = 'NON_IMPRIMÉ',
  IMPRIMÉ = 'IMPRIMÉ',
  RÉIMPRIMÉ = 'RÉIMPRIMÉ',
  ERREUR_IMPRESSION = 'ERREUR_IMPRESSION',
}

/** Déclarations SQL des tables locales. */
export const SCHEMA_SQL = `
-- Clients (création possible hors ligne, statut PROVISOIRE jusqu'à acceptation serveur)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone_normalise TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('PROVISOIRE', 'CONFIRME')),
  agence_id TEXT NOT NULL,
  date_creation_declaree TEXT NOT NULL,
  doublon_potentiel INTEGER NOT NULL DEFAULT 0,
  cle_idempotence TEXT NOT NULL UNIQUE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('DRAFT','PENDING','SYNCED','CONFLICT','ERROR')),
  date_maj TEXT NOT NULL
);
`;

-- Dossiers (un seul ouvert par client et par agence)
CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  reference_provisoire TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  agence_id TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('OUVERT','FERME','REJETE')),
  date_creation_declaree TEXT NOT NULL,
  cle_idempotence TEXT NOT NULL UNIQUE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('DRAFT','PENDING','SYNCED','CONFLICT','ERROR')),
  date_maj TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Collectes (référence provisoire + numéro officiel serveur)
CREATE TABLE IF NOT EXISTS collectes (
  id TEXT PRIMARY KEY,
  reference_provisoire TEXT NOT NULL UNIQUE,
  client_receipt_no TEXT,
  dossier_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  montant_xaf INTEGER NOT NULL,
  date_heure_declaree TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('BROUILLON','ENREGISTRÉE_LOCAL','EN_ATTENTE','ACCEPTÉE','REJETÉE','CONFLIT')),
  cle_idempotence TEXT NOT NULL UNIQUE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('DRAFT','PENDING','SYNCED','CONFLICT','ERROR')),
  print_status TEXT NOT NULL CHECK (print_status IN ('NON_IMPRIMÉ','IMPRIMÉ','RÉIMPRIMÉ','ERREUR_IMPRESSION')),
  date_maj TEXT NOT NULL,
  FOREIGN KEY (dossier_id) REFERENCES dossiers(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
`;
export const SCHEMA_SQL_SUITE = `

-- Remises (déclaration agent ≠ confirmation caisse)
CREATE TABLE IF NOT EXISTS remises (
  id TEXT PRIMARY KEY,
  agence_id TEXT NOT NULL,
  montant_total_xaf INTEGER NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('DÉCLARÉE','EN_ATTENTE_CAISSIER','CONFIRMÉE','ÉCART','ANNULÉE')),
  cle_idempotence TEXT NOT NULL UNIQUE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('DRAFT','PENDING','SYNCED','CONFLICT','ERROR')),
  date_declaree TEXT NOT NULL,
  date_confirmee_caisse TEXT,
  motif_ecart TEXT,
  date_maj TEXT NOT NULL
);

-- Lien collecte ↔ remise (une collecte ne peut appartenir qu'à une seule remise)
CREATE TABLE IF NOT EXISTS collecte_remise (
  collecte_id TEXT NOT NULL,
  remise_id TEXT NOT NULL,
  PRIMARY KEY (collecte_id),
  FOREIGN KEY (collecte_id) REFERENCES collectes(id),
  FOREIGN KEY (remise_id) REFERENCES remises(id)
);

-- Clôtures journalières (une par agent et par jour)
CREATE TABLE IF NOT EXISTS clotures (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  date_metier TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('DÉCLARÉE_LOCAL','EN_ATTENTE','CONFIRMÉE','ROUVERTE')),
  total_collectes_xaf INTEGER NOT NULL,
  cle_idempotence TEXT NOT NULL UNIQUE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('DRAFT','PENDING','SYNCED','CONFLICT','ERROR')),
  date_declaree TEXT NOT NULL,
  date_confirmee TEXT,
  motif_reouverture TEXT,
  date_maj TEXT NOT NULL
);

-- Reçus (référence provisoire + numéro officiel)
CREATE TABLE IF NOT EXISTS recus (
  id TEXT PRIMARY KEY,
  collecte_id TEXT NOT NULL,
  reference_provisoire TEXT NOT NULL,
  client_receipt_no TEXT,
  statut_impression TEXT NOT NULL CHECK (statut_impression IN ('NON_IMPRIMÉ','IMPRIMÉ','RÉIMPRIMÉ','ERREUR_IMPRESSION')),
  date_impression TEXT,
  cle_idempotence TEXT NOT NULL UNIQUE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('DRAFT','PENDING','SYNCED','CONFLICT','ERROR')),
  date_maj TEXT NOT NULL,
  FOREIGN KEY (collecte_id) REFERENCES collectes(id)
);
`;
