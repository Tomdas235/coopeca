import { openDatabase } from 'expo-sqlite';
import { SCHEMA_SQL, SCHEMA_SQL_SUITE, SCHEMA_VERSION } from './schema';

/**
 * Connexion à la base de données locale SQLite.
 *
 * Ouverte une seule fois et partagée par tous les repositories.
 * Conformément à DECISIONS_VALIDÉES_FRONTEND §7, expo-sqlite est installé
 * et le schéma local est créé après validation du modèle.
 */
let db: any = null;

export function getDatabase(): any {
  if (!db) {
    db = openDatabase('coopeca.db');
    // Exécuter le schéma au premier ouverture
    db.execSync?.(SCHEMA_SQL + SCHEMA_SQL_SUITE);
  }
  return db;
}

export { SCHEMA_VERSION };
