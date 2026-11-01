import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { getAccessToken } from './tokenStore';

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

export type UserRole = 'AGENT' | 'SUPERVISOR' | 'CASHIER' | 'ACCOUNTANT' | 'ADMIN' | 'AUDITOR';

export interface AuthSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  branches: Array<{ id: string; code: string; name: string }>;
}

export type TontineCycleStatus = 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CLOSED';

export interface MarketRef {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CycleSummary {
  id: string;
  status: TontineCycleStatus;
  fixedAmountXaf: string;
  installmentCount: number;
  totalCollectedXaf: string;
  targetInstallments: 31;
  availableBalanceXaf: string;
  commissionPaid: boolean;
}

export interface DepositResult {
  transactionId: string;
  replayed: boolean;
  cycleId: string;
}

export class ApiError extends Error {
  readonly isUnauthorized: boolean;
  readonly isNetworkError: boolean;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.isUnauthorized = status === 401;
    this.isNetworkError = status === undefined;
  }
}

/**
 * Génère une clé d'idempotence UUID v4 pour les opérations locales.
 */
export function generateIdempotencyKey(): string {
  return Crypto.randomUUID();
}

/** Base URL de l'API. EXPO_PUBLIC_API_BASE_URL est prioritaire.
 * Web/iOS simulateur : localhost; émulateur Android : 10.0.2.2.
 * Appareil physique : définir l'adresse LAN joignable du backend.
 */
const defaultApiBase = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBase;

/** Lecture de la base URL globale */
export function getApiBase(): string {
  return apiBase;
}


/** Effectue une requête vers l'API COOPECA. */
async function apiRequest<T>(endpoint: string, method: Method = 'GET', body?: any): Promise<ApiResponse<T>> {
  const url = `${apiBase}/api/v1${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError('Service API indisponible. Vérifiez la connexion réseau.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message || `Erreur API ${response.status}`, response.status);
  }

  return {
    status: 'success',
    data,
  } as ApiResponse<T>;
}

/** Ouvre une session selon le contrat strict du backend NestJS. */
export async function createSession(username: string, password: string): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>('/auth/sessions', 'POST', { username, password });
  if (!response.data) throw new ApiError('Réponse de connexion invalide.');
  return response.data;
}

/** Récupère le profil authentifié et les agences autorisées. */
export async function getProfile(): Promise<UserProfile> {
  const response = await apiRequest<UserProfile>('/me');
  if (!response.data) throw new ApiError('Réponse de profil invalide.');
  return response.data;
}

/** Récupère la liste des marchés disponibles. */
export async function listMarkets(): Promise<MarketRef[]> {
  const response = await apiRequest<MarketRef[]>('/markets');
  return response.data ?? [];
}

/** Définit l'état actif d'un marché. */
export async function setMarketActive(marketId: string, active: boolean): Promise<ApiResponse> {
  return apiRequest(`/markets/${marketId}/active`, 'POST', { isActive: active });
}

/** Crée un cycle sur un dossier, selon la route versionnée du backend. */
export async function createCycle(dossierId: string, fixedAmountXaf: number, clientOperationId = generateIdempotencyKey()): Promise<CycleSummary> {
  const response = await apiRequest<CycleSummary>(`/dossiers/${dossierId}/cycles`, 'POST', {
    fixedAmountXaf: String(fixedAmountXaf),
    clientOperationId,
  });
  if (!response.data) throw new ApiError('Réponse de création du cycle invalide.');
  return response.data;
}

/** Lit le solde et la progression d'un cycle depuis le backend. */
export async function getCycle(cycleId: string): Promise<CycleSummary> {
  const response = await apiRequest<CycleSummary>(`/tontine-cycles/${cycleId}`);
  if (!response.data) throw new ApiError('Réponse de cycle invalide.');
  return response.data;
}

/** Enregistre un versement fixe avec une clé d'idempotence durable côté appelant. */
export async function depositToCycle(cycleId: string, amountXaf: number, idempotencyKey = generateIdempotencyKey()): Promise<DepositResult> {
  const response = await apiRequest<DepositResult>(`/tontine-cycles/${cycleId}/deposits`, 'POST', {
    amountXaf: String(amountXaf),
    idempotencyKey,
  });
  if (!response.data) throw new ApiError('Réponse de versement invalide.');
  return response.data;
}

/** Demande un retrait sur un cycle. */
export async function requestWithdrawal(cycleId: string, amountXaf: number, idempotencyKey?: string): Promise<ApiResponse> {
  return apiRequest(`/tontine-cycles/${cycleId}/withdrawals`, 'POST', {
    amountXaf: String(amountXaf),
    closesCycle: false,
    idempotencyKey: idempotencyKey || generateIdempotencyKey(),
  });
}

/** Récupère les demandes de retrait en attente. */
export async function getPendingWithdrawals(): Promise<ApiResponse> {
  return apiRequest('/withdrawals/pending');
}

/** Revise une demande de retrait (approuvée/ rejetée). */
export async function reviewWithdrawal(withdrawalRequestId: string, decision: 'APPROVE' | 'REJECT', reason?: string): Promise<ApiResponse> {
  return apiRequest(`/withdrawals/${withdrawalRequestId}/review`, 'POST', {
    decision,
    reason,
  });
}

/** Crée un marché, réservé aux rôles de supervision et d'administration. */
export async function createMarket(input: { code: string; name: string }): Promise<MarketRef> {
  const response = await apiRequest<MarketRef>('/markets', 'POST', input);
  if (!response.data) throw new ApiError('Réponse de création du marché invalide.');
  return response.data;
}