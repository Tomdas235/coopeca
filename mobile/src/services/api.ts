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

/** Base URL de l'API — lue depuis les variables d'environnement.
 * * Production/APK Android : COOPECA_API_URL=http://adresse-IP-serveur:3000
 * * Développement local : http://localhost:3000 ou http IP-local:3000
 * * Jamais 10.0.2.2 en production (émulateur uniquement).
 */
const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3000';

/** Lecture de la base URL globale */
export function getApiBase(): string {
  return apiBase;
}

/** Génère une clé d'idempotence UUID v4 pour les opérations locales */
export function generateIdempotencyKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

/** Effectue une requête vers l'API COOPECA. */
async function apiRequest<T>(endpoint: string, method: Method = 'GET', body?: any): Promise<ApiResponse<T>> {
  const url = `${apiBase}/api/v1${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Erreur API ${response.status}`);
  }

  return {
    status: 'success',
    data: data.data,
  } as ApiResponse<T>;
}

/** Récupère la liste des marchés disponibles. */
export async function listMarkets(): Promise<ApiResponse> {
  return apiRequest('/markets', 'GET');
}

/** Définit l'état actif d'un marché. */
export async function setMarketActive(marketId: string, active: boolean): Promise<ApiResponse> {
  return apiRequest(`/markets/${marketId}/active`, 'POST', { active });
}

/** Crée un nouveau cycle tontine pour un client. */
export async function createCycle(clientId: string, collectionAgentId: string, branchId: string, fixedAmountXaf: number): Promise<ApiResponse> {
  return apiRequest('/cycles/open', 'POST', {
    clientId,
    collectionAgentId,
    branchId,
    fixedAmountXaf,
  });
}

/** Effectue un versement (déposit) sur un cycle. */
export async function depositToCycle(cycleId: string, amountXaf: number, idempotencyKey?: string): Promise<ApiResponse> {
  return apiRequest('/cycles/tontine-cycles/deposits', 'POST', {
    cycleId,
    amountXaf,
    idempotencyKey: idempotencyKey || generateIdempotencyKey(),
  });
}

/** Demande un retrait sur un cycle. */
export async function requestWithdrawal(cycleId: string, amountXaf: number, idempotencyKey?: string): Promise<ApiResponse> {
  return apiRequest('/cycles/tontine-cycles/withdrawals', 'POST', {
    cycleId,
    amountXaf,
    idempotencyKey: idempotencyKey || generateIdempotencyKey(),
  });
}

/** Récupère les demandes de retrait en attente. */
export async function getPendingWithdrawals(cycleId: string): Promise<ApiResponse> {
  return apiRequest(`/cycles/withdrawals/pending?cycleId=${cycleId}`, 'GET');
}

/** Revise une demande de retrait (approuvée/ rejetée). */
export async function reviewWithdrawal(withdrawalRequestId: string, decision: 'APPROVE' | 'REJECT', reason?: string): Promise<ApiResponse> {
  return apiRequest(`/admin/cycles/withdrawals/${withdrawalRequestId}/review`, 'POST', {
    decision,
    reason,
  });
}