import { ApiError, createSession, getProfile, type UserRole } from '../../services/api';
import { getAccessToken, setAccessToken } from '../../services/tokenStore';

/**
 * Service d'authentification COOPECA — Gestion de session agent.
 *
 * Règles non négociables :
 * - L'identifiant correspond au username backend (ex: agent.paris1).
 * - Le jeton Bearer est conservé hors de l'UI et injecté par `services/api`.
 * - Les rôles contrôlent l'accès aux endpoints (/api/v1/... selon les permissions).
 * - En mode démo (EXPO_PUBLIC_DEMO_MODE=true), toute connexion valide accepte un
 *   identifiant répertorié, sans appel réseau.
 * - En production, POST /api/v1/auth/sessions ouvre la session, puis
 *   GET /api/v1/me fournit le profil et les agences autorisées.
 */

/** Profil tel qu'affiché par l'écran Session. */
export interface AuthProfile {
  identity: string;
  roles: string[];
  agency: string;
}

/**
 * Session ouverte. `profile` porte ce que l'UI affiche ; `user` conserve les
 * identifiants techniques nécessaires aux appels métier.
 */
export interface AuthSession {
  profile: AuthProfile;
  user?: {
    id: string;
    username: string;
    role: UserRole;
    branchId?: string;
  };
  expiresAt?: Date;
  createdAt?: Date;
}

export interface AuthenticationService {
  authenticate(credentials: { identifier: string; password: string }): Promise<AuthSession>;
  getCurrentSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
}

/**
 * Levée lorsque le service d'authentification réel n'est pas joignable ou pas
 * configuré : l'UI distingue ce cas d'un simple refus d'identifiants.
 */
export class AuthenticationUnavailableError extends Error {
  constructor(message = "Le service d'authentification n'est pas disponible.") {
    super(message);
    this.name = 'AuthenticationUnavailableError';
  }
}

interface PersistedSession {
  session: AuthSession;
  token: string | null;
}

export const authenticationService: AuthenticationService = (() => {
  const DEMO_IDENTIFIERS = [
    'admin.coopeca',
    'superv.paris1',
    'superv.paris2',
    'agent.paris1',
    'agent.paris2',
    'agent.test',
    'cashier.test',
  ];

  const STORAGE_KEY = 'coopeca_auth_session';
  const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
  const hasLocalStorage = typeof window !== 'undefined';

  let storedSession: AuthSession | null = null;

  /**
   * Lecture de la session courante via une fonction : `storedSession` n'est
   * affecté que dans des fermetures, donc une lecture directe serait réduite
   * à `null` par l'analyse de flux de TypeScript.
   */
  function sessionCourante(): AuthSession | null {
    return storedSession;
  }

  function lireStockage(): void {
    if (!hasLocalStorage) return;
    try {
      const brut = localStorage.getItem(STORAGE_KEY);
      if (!brut) return;
      const persisted = JSON.parse(brut) as Partial<PersistedSession>;
      storedSession = persisted.session ?? null;
      setAccessToken(persisted.token ?? null);
    } catch {
      storedSession = null;
      setAccessToken(null);
    }
  }

  function ecrireStockage(session: AuthSession | null): void {
    if (!hasLocalStorage) return;
    try {
      if (session === null) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const persisted: PersistedSession = { session, token: getAccessToken() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Stockage indisponible (mode privé, quota) : la session reste en mémoire.
    }
  }

  function roleDemo(identifier: string): UserRole {
    if (identifier === 'admin.coopeca') return 'ADMIN';
    if (identifier.startsWith('superv.')) return 'SUPERVISOR';
    if (identifier.startsWith('cashier.')) return 'CASHIER';
    return 'AGENT';
  }

  function sessionDemo(identifier: string): AuthSession {
    const role = roleDemo(identifier);
    return {
      profile: {
        identity: identifier,
        roles: [role],
        agency: 'Démonstration',
      },
      user: {
        id: identifier.replace('.', '-'),
        username: identifier,
        role,
      },
      createdAt: new Date(),
    };
  }

  function sessionDepuisProfil(
    profil: Awaited<ReturnType<typeof getProfile>>,
    expiresAt?: Date,
  ): AuthSession {
    const agences = profil.branches.map(({ code, name }) => (code ? `${code} — ${name}` : name));

    return {
      profile: {
        identity: profil.fullName.trim() !== '' ? profil.fullName : profil.username,
        roles: [profil.role],
        agency: agences.length > 0 ? agences.join(', ') : 'Aucune agence attribuée',
      },
      user: {
        id: profil.id,
        username: profil.username,
        role: profil.role,
        branchId: profil.branches[0]?.id,
      },
      expiresAt,
      createdAt: new Date(),
    };
  }

  function retenirSession(session: AuthSession | null): void {
    storedSession = session;
    ecrireStockage(session);
  }

  lireStockage();

  return {
    async authenticate(credentials) {
      if (DEMO_MODE) {
        if (!DEMO_IDENTIFIERS.includes(credentials.identifier)) {
          throw new Error(
            'Identifiant inconnu en mode démo. Identifiants valides : ' +
              DEMO_IDENTIFIERS.join(', '),
          );
        }
        const session = sessionDemo(credentials.identifier);
        retenirSession(session);
        return session;
      }

      try {
        const jeton = await createSession(credentials.identifier, credentials.password);
        setAccessToken(jeton.accessToken);

        const profil = await getProfile();
        const session = sessionDepuisProfil(
          profil,
          new Date(Date.now() + jeton.expiresIn * 1000),
        );
        retenirSession(session);
        return session;
      } catch (erreur) {
        setAccessToken(null);
        if (erreur instanceof ApiError && erreur.isNetworkError) {
          throw new AuthenticationUnavailableError(erreur.message);
        }
        throw erreur;
      }
    },

    async getCurrentSession() {
      if (DEMO_MODE) return sessionCourante();

      const jeton = getAccessToken();
      if (!jeton) return null;

      try {
        const profil = await getProfile();
        // L'échéance d'origine est conservée : la relecture du profil ne
        // prolonge pas la session.
        const session = sessionDepuisProfil(profil, sessionCourante()?.expiresAt);
        retenirSession(session);
        return session;
      } catch (erreur) {
        if (erreur instanceof ApiError && erreur.isUnauthorized) {
          retenirSession(null);
          setAccessToken(null);
          return null;
        }

        // Hors ligne : une session déjà ouverte reste utilisable (COOPECA est
        // pensé pour le terrain, sans réseau permanent).
        const session = sessionCourante();
        if (session !== null) return session;

        if (erreur instanceof ApiError) {
          throw new AuthenticationUnavailableError(erreur.message);
        }
        throw erreur;
      }
    },

    async logout() {
      retenirSession(null);
      setAccessToken(null);
      ecrireStockage(null);
    },
  };
})();

/** Alias historique du service d'authentification. */
export const authService = authenticationService;

export default authenticationService;
