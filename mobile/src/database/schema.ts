/**
 * Schéma de la base de données LOCALE (SQLite, via expo-sqlite).
 *
 * État : squelette d'étape — AUCUNE table métier n'est définie.
 *
 * La bibliothèque SQLite (expo-sqlite, cf. AGENT.md §2) ne sera installée
 * qu'au moment d'implémenter les repositories. Aucune migration n'existe
 * à ce stade et AUCUNE modification du schéma SQL serveur v1.1 ni de
 * migration serveur n'est autorisée à cette étape.
 *
 * Les tables attendent les validations ouvertes de
 * docs/DECISIONS_METIER.md §4 et docs/IMPACTS_SCHEMA_SQL.md §8.
 */

/** Décrit une migration versionnée de la base locale. */
export interface MigrationLocale {
  /** Numéro de version appliqué par cette migration (strictement croissant). */
  readonly version: number;
  /** Libellé court de la migration. */
  readonly nom: string;
}

/** Registre des migrations locales — vide : aucune migration à ce stade. */
export const migrations: readonly MigrationLocale[] = [];

/** Version courante du schéma local (= dernière migration appliquée). */
export const SCHEMA_VERSION = migrations.length > 0 ? migrations[migrations.length - 1]!.version : 0;
