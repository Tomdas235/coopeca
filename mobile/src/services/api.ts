/**
 * Client API COOPECA — Implémentée pour les cycles à 31 versements (§3.15 DECISIONS_METIER)
 *
 * Contrat d'API (docs/IMPACTS_SCHEMA_SQL.md §8, DECISIONS_METIER.md §4) :
 * - Chaque opération porte une clé d'idempotence (UUID v4 généré localement)
 * - Les montants sont transmis en entiers XAF dans le corps JSON
 * - dateHeureDeclairee (horloge appareil) et receivedAt (instant serveur) sont distincts
 * - Le serveur répond avec le même résultat si la même clé est renvoyée (idempotence stricte)
 * - En cas de conflit, le serveur renvoie 409 avec un motif ; le frontend conserve l'opération et affiche un écran de résolution (jamais de résolution silencieuse)
 */
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Génère une clé d'idempotence UUID v4 pour les opérations locales
 */
export function generateIdempotencyKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

/** Base URL de l'API — par défaut pour l'émulateur Android */
let apiBase = 'http://10.0.2.2:3000';

/** Mise à jour dynamique de la base URL (pour les tests/émulateur) */
export function setApiBaseUrl(url: string) {
  apiBase = url;
}

/** Lecture de la base URL globale */
export function getApiBase(): string {
  return apiBase;
}