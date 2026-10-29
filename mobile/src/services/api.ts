import * as Crypto from 'expo-crypto';
import { getAccessToken } from './tokenStore';

/**
 * Client HTTP COOPECA — aligné sur l'API NestJS (`/api/v1`).
 *
 * Contrat réel du backend (docs/DECISIONS_METIER.md §4, backend/src/cycles) :
 * - chaque réponse est renvoyée telle quelle : PAS d'enveloppe `{ data }` ;
 * - les montants XAF transitent en entiers sérialisés en chaîne (jamais de flottant) ;
 * - les clés d'idempotence sont des UUID v4 (`@db.Uuid` côté serveur) ;
 * - l'authentification est un jeton Bearer porté par `Authorization` ;
 * - en cas d'erreur, le corps est `{ message, code? }` (filtre global du backend).
 */
export type HttpMethod = 'GET' | 'POST' | 'PATCH';

/** Rôles applicatifs reconnus par le backend. */
export type UserRole =
  | 'AGENT'
  | 'CASHIER'
  | 'SUPERVISOR'
  | 'ACCOUNTANT'
  | 'ADMIN'
  | 'AUDITOR';

export type TontineCycleStatus = 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CLOSED';
export type WithdrawalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Montant accepté en entrée : converti en entier XAF sérialisé avant envoi. */
export type AmountInput = number | bigint | string;

/** Marché tel que renvoyé par `GET /markets` (identifiant + libellé). */
export interface MarketRef {
  id: string;
  code: string;
  name: string;
}

/** Marché détaillé (création / changement d'état). */
export interface Market extends MarketRef {
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Réponse de `POST /auth/sessions` — le profil se lit ensuite via `GET /me`. */
export interface SessionToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthenticatedProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  branches: Array<{ id: string; code: string; name: string }>;
}

/** Cycle sérialisé par le backend (montants en chaînes). */
export interface CycleSummary {
  id: string;
  status: TontineCycleStatus;
  fixedAmountXaf: string;
  installmentCount: number;
  totalCollectedXaf: string;
  targetInstallments: number;
  availableBalanceXaf: string;
  commissionPaid: boolean;
}

export interface DepositResult {
  transactionId: string;
  replayed: boolean;
  cycleId: string;
}

export interface CycleStateResult {
  cycleId: string;
  status: TontineCycleStatus;
  replayed: boolean;
}

export interface WithdrawalRequestResult {
  withdrawalRequestId: string;
  status: WithdrawalRequestStatus;
  replayed: boolean;
}

export interface PendingWithdrawal {
  id: string;
  cycleId: string;
  client: { clientCode: string; firstName: string; lastName: string };
  requestedBy: { id: string; fullName: string; username: string };
  amountXaf: string;
  closesCycle: boolean;
  reason: string | null;
  requestedAt: string;
}

export interface WithdrawalReviewResult {
  withdrawalRequestId: string;
  status: WithdrawalRequestStatus;
  transactionId: string | null;
  replayed: boolean;
  commissionXaf?: string;
  remainingBalanceXaf?: string;
}

const DEFAULT_API_BASE = 'http://10.0.2.2:3000';
const API_PREFIX = '/api/v1';

/**
 * Base URL de l'API — lue depuis `EXPO_PUBLIC_API_BASE_URL`.
 * * Production/APK Android : COOPECA_API_URL=http://adresse-IP-serveur:3000
 * * Développement local : http://localhost:3000 ou http IP-local:3000
 * * Jamais 10.0.2.2 en production (émulateur uniquement).
 */
const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '');

/** Lecture de la base URL globale (diagnostic / affichage). */
export function getApiBase(): string {
  return apiBase;
}

/** Erreur normalisée du client : statut HTTP, message serveur et code métier. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** Aucune session valide : jeton absent, expiré ou révoqué. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Conflit métier ou rejeu d'idempotence (409). */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** Serveur injoignable (panne réseau, pas de réponse HTTP). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Requête invalide.',
  401: 'Authentification requise.',
  403: 'Action non autorisée pour ce rôle.',
  404: 'Ressource introuvable.',
  409: 'Conflit métier.',
  500: 'Erreur interne du serveur.',
  503: 'Service indisponible.',
};

const XAF_PATTERN = /^[1-9][0-9]*$/;

/**
 * Convertit un montant en entier XAF sérialisé (chaîne décimale), seule forme
 * acceptée par l'API. Refuse explicitement les flottants et les valeurs <= 0
 * plutôt que d'arrondir (AGENTS.md §4).
 */
export function toXafString(amount: AmountInput, label = 'montant'): string {
  const invalide = () =>
    new Error(`Montant ${label} invalide : entier XAF strictement positif attendu.`);

  if (typeof amount === 'bigint') {
    if (amount <= 0n) throw invalide();
    return amount.toString();
  }

  if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (!XAF_PATTERN.test(trimmed)) throw invalide();
    return trimmed;
  }

  if (!Number.isSafeInteger(amount) || amount <= 0) throw invalide();
  return String(amount);
}

/**
 * Clé d'idempotence au format UUID v4, exigé par le backend (colonnes `@db.Uuid`).
 */
export function generateIdempotencyKey(): string {
  return Crypto.randomUUID();
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Envoie l'en-tête Authorization (défaut : oui). */
  authenticated?: boolean;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  const suffix = params.length > 0 ? `?${params.join('&')}` : '';
  return `${apiBase}${API_PREFIX}${normalized}${suffix}`;
}

async function readPayload(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (raw.trim() === '') return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  const body =
    typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const code = typeof body.code === 'string' ? body.code : undefined;
  let message = DEFAULT_MESSAGES[status] ?? 'Erreur inattendue de l’API.';

  const rawMessage = body.message;
  if (typeof rawMessage === 'string' && rawMessage.trim() !== '') {
    message = rawMessage;
  } else if (Array.isArray(rawMessage) && rawMessage.length > 0) {
    message = rawMessage.map(String).join(' | ');
  } else if (typeof payload === 'string' && payload.trim() !== '') {
    message = payload;
  }

  return new ApiError(status, message, code);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, authenticated = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (authenticated) {
    const token = getAccessToken();
    if (!token) throw new ApiError(401, 'Aucune session active. Connectez-vous.');
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Serveur injoignable. Vérifiez la connexion et l’adresse de l’API.');
  }

  const payload = await readPayload(response);
  if (!response.ok) throw toApiError(response.status, payload);
  if (payload === null) throw new ApiError(response.status, 'Réponse vide de l’API.');

  return payload as T;
}

// ── Session ────────────────────────────────────────────────────────────────

/**
 * Ouvre une session : `POST /auth/sessions`.
 *
 * L'identifiant correspond au `username` backend (ex. agent.paris1). La réponse
 * ne contient pas le profil : le lire ensuite via `getProfile()`.
 */
export async function createSession(
  identifier: string,
  password: string,
): Promise<SessionToken> {
  return request<SessionToken>('/auth/sessions', {
    method: 'POST',
    authenticated: false,
    body: { username: identifier, password },
  });
}

/** Profil authentifié et agences autorisées : `GET /me`. */
export async function getProfile(): Promise<AuthenticatedProfile> {
  return request<AuthenticatedProfile>('/me');
}

// ── Marchés ────────────────────────────────────────────────────────────────

/** Marchés actifs : `GET /markets`. */
export async function listMarkets(): Promise<MarketRef[]> {
  return request<MarketRef[]>('/markets');
}

/** Créer un marché (ADMIN/SUPERVISOR) : `POST /markets`. */
export async function createMarket(input: { code: string; name: string }): Promise<Market> {
  return request<Market>('/markets', {
    method: 'POST',
    body: { code: input.code.trim(), name: input.name.trim() },
  });
}

/** Activer/désactiver un marché (ADMIN/SUPERVISOR) : `POST /markets/{id}/active`. */
export async function setMarketActive(marketId: string, isActive: boolean): Promise<Market> {
  return request<Market>(`/markets/${encodeURIComponent(marketId)}/active`, {
    method: 'POST',
    body: { isActive },
  });
}

// ── Affectation client → marché/agent ──────────────────────────────────────

/** Affecter un client à un marché et un agent collecteur (ADMIN/SUPERVISOR). */
export async function assignClientToCycleProduct(input: {
  clientId: string;
  marketId: string;
  collectionAgentId: string;
}): Promise<{
  id: string;
  clientCode: string;
  branchId: string;
  marketId: string | null;
  collectionAgentId: string | null;
}> {
  return request<{
    id: string;
    clientCode: string;
    branchId: string;
    marketId: string | null;
    collectionAgentId: string | null;
  }>(`/clients/${encodeURIComponent(input.clientId)}/cycle-assignment`, {
    method: 'POST',
    body: { marketId: input.marketId, collectionAgentId: input.collectionAgentId },
  });
}

// ── Cycles à 31 versements ─────────────────────────────────────────────────

/** Cycles d'un dossier : `GET /dossiers/{dossierId}/cycles`. */
export async function listDossierCycles(dossierId: string): Promise<CycleSummary[]> {
  return request<CycleSummary[]>(`/dossiers/${encodeURIComponent(dossierId)}/cycles`);
}

/** Ouvrir un cycle (AGENT affecté) : `POST /dossiers/{dossierId}/cycles`. */
export async function openCycle(
  dossierId: string,
  input: { fixedAmountXaf: AmountInput; clientOperationId?: string },
): Promise<CycleSummary> {
  return request<CycleSummary>(`/dossiers/${encodeURIComponent(dossierId)}/cycles`, {
    method: 'POST',
    body: {
      fixedAmountXaf: toXafString(input.fixedAmountXaf, 'fixe du cycle'),
      clientOperationId: input.clientOperationId ?? generateIdempotencyKey(),
    },
  });
}

/** Détail d'un cycle, solde disponible et commission : `GET /tontine-cycles/{id}`. */
export async function getCycle(cycleId: string): Promise<CycleSummary> {
  return request<CycleSummary>(`/tontine-cycles/${encodeURIComponent(cycleId)}`);
}

/**
 * Enregistrer un versement fixe (AGENT affecté) :
 * `POST /tontine-cycles/{cycleId}/deposits`.
 */
export async function depositToCycle(
  cycleId: string,
  amountXaf: AmountInput,
  options: { idempotencyKey?: string; declaredAt?: string } = {},
): Promise<DepositResult> {
  return request<DepositResult>(`/tontine-cycles/${encodeURIComponent(cycleId)}/deposits`, {
    method: 'POST',
    body: {
      amountXaf: toXafString(amountXaf, 'du versement'),
      idempotencyKey: options.idempotencyKey ?? generateIdempotencyKey(),
      declaredAt: options.declaredAt,
    },
  });
}

/** Suspendre le cycle (AGENT affecté) : `POST /tontine-cycles/{id}/suspend`. */
export async function suspendCycle(
  cycleId: string,
  options: { requestId?: string; reason?: string } = {},
): Promise<CycleStateResult> {
  return request<CycleStateResult>(`/tontine-cycles/${encodeURIComponent(cycleId)}/suspend`, {
    method: 'POST',
    body: {
      requestId: options.requestId ?? generateIdempotencyKey(),
      reason: options.reason,
    },
  });
}

/** Reprendre le même cycle (AGENT affecté) : `POST /tontine-cycles/{id}/resume`. */
export async function resumeCycle(
  cycleId: string,
  options: { requestId?: string; reason?: string } = {},
): Promise<CycleStateResult> {
  return request<CycleStateResult>(`/tontine-cycles/${encodeURIComponent(cycleId)}/resume`, {
    method: 'POST',
    body: {
      requestId: options.requestId ?? generateIdempotencyKey(),
      reason: options.reason,
    },
  });
}

// ── Retraits ───────────────────────────────────────────────────────────────

/** Demander un retrait (AGENT affecté) : `POST /tontine-cycles/{id}/withdrawals`. */
export async function requestWithdrawal(
  cycleId: string,
  input: {
    amountXaf: AmountInput;
    closesCycle?: boolean;
    idempotencyKey?: string;
    reason?: string;
  },
): Promise<WithdrawalRequestResult> {
  return request<WithdrawalRequestResult>(
    `/tontine-cycles/${encodeURIComponent(cycleId)}/withdrawals`,
    {
      method: 'POST',
      body: {
        amountXaf: toXafString(input.amountXaf, 'du retrait'),
        closesCycle: input.closesCycle ?? false,
        idempotencyKey: input.idempotencyKey ?? generateIdempotencyKey(),
        reason: input.reason,
      },
    },
  );
}

/** File des retraits à examiner (SUPERVISOR) : `GET /withdrawals/pending`. */
export async function listPendingWithdrawals(): Promise<PendingWithdrawal[]> {
  return request<PendingWithdrawal[]>('/withdrawals/pending');
}

/**
 * Approuver/rejeter une demande de retrait (SUPERVISOR) :
 * `POST /withdrawals/{id}/review`. Un motif est obligatoire pour un rejet.
 */
export async function reviewWithdrawal(
  withdrawalRequestId: string,
  decision: 'APPROVE' | 'REJECT',
  reason?: string,
): Promise<WithdrawalReviewResult> {
  if (decision === 'REJECT' && (reason ?? '').trim() === '') {
    throw new Error('Un motif est requis pour rejeter le retrait.');
  }

  return request<WithdrawalReviewResult>(
    `/withdrawals/${encodeURIComponent(withdrawalRequestId)}/review`,
    {
      method: 'POST',
      body: { decision, reason: reason?.trim() || undefined },
    },
  );
}
