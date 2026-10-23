/**
 * Service d'authentification COOPECA — Gestion de session agent.
 *
 * Règles non négociables :
 * - L'identifiant correspond au username backend (ex: agent.paris1).
 * - Le token JWT est porté par l'en-tête Authorization des requêtes.
 * - Les rôles contrôlent l'accès aux endpoints (/api/v1/admin/... selon les permissions).
 * - En mode démo (EXPO_PUBLIC_DEMO_MODE=true), toute connexion valide accepte un identifiant répertorié.
 * - En production, le login vérifie auprès de POST /api/v1/auth/login.
 */
export interface AuthSession {
  user: {
    id: string;
    username: string;
    role: 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT' | 'AGENT' | 'CASHIER' | 'AUDITOR';
    branchId?: string;
  };
  token: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
  sessionId: string;
}

export interface AuthenticationService {
  getUser(): any;
  getToken(): string;
  getRole(): string;
  getBranchId(): string | null;
  isAuthenticated(): boolean;
  authenticate(credentials: { identifier: string; password: string }): Promise<AuthSession>;
  logout(): Promise<void>;
}

export const authService = (() => {
  const DEMO_IDENTIFIERS = [
    'admin.coopeca',
    'superv.paris1',
    'superv.paris2',
    'agent.paris1',
    'agent.paris2',
    'agent.test',
    'cashier.test',
  ];

  // Session démo stockée en localStorage (navigateur) ou mémoire (RN)
  let storedSession: AuthSession | null = null;

  // Vérifier le stockage disponible
  const hasLocalStorage = typeof window !== 'undefined';

  function loadStoredSession(): void {
    if (!hasLocalStorage) return;
    try {
      const data = localStorage.getItem('coopeca_auth_session');
      if (data) storedSession = JSON.parse(data);
    } catch {
      storedSession = null;
    }
  }

  function saveStoredSession(session: AuthSession): void {
    if (!hasLocalStorage) return;
    localStorage.setItem('coopeca_auth_session', JSON.stringify(session));
  }

  function clearStoredSession(): void {
    if (!hasLocalStorage) return;
    localStorage.removeItem('coopeca_auth_session');
  }

  loadStoredSession();

  // ── Service public ──────────────────────────────────────────────
  const service: AuthenticationService = {
    getUser: () => storedSession?.user ?? null,
    getToken: () => storedSession?.token ?? '',
    getRole: () => storedSession?.role ?? 'ANONYMOUS',
    getBranchId: () => storedSession?.branchId ?? null,
    isAuthenticated: () => !!storedSession?.token,
    authenticate: async credentials => {
      // Mode démo : accepter tout identifiant répertorié
      if (process.env.EXPO_PUBLIC_DEMO_MODE === 'true') {
        if (!DEMO_IDENTIFIERS.includes(credentials.identifier)) {
          throw new Error(
            'Identifiant inconnu en mode démo. Identifiants valides : ' +
              DEMO_IDENTIFIERS.join(', ')
          );
        }
        // Construire une session démo selon le rôle de l'identifiant
        const isParis1 = credentials.identifier.includes('paris1');
        const isParis2 = credentials.identifier.includes('paris2');
        const isAdmin = credentials.identifier === 'admin.coopeca';

        let role: AuthSession['role'];
        let branchId: AuthSession['branchId'];

        if (isAdmin) {
          role = 'ADMIN';
          branchId = 'AGENCY-ROOT';
        } else if (isParis1) {
          role = 'AGENT';
          branchId = 'BRANCH-P1';
        } else if (isParis2) {
          role = 'AGENT';
          branchId = 'BRANCH-P2';
        } else {
          role = 'AGENT';
          branchId = null;
        }

        const session: AuthSession = {
          user: {
            id: credentials.identifier.replace('.', '-'),
            username: credentials.identifier,
            role,
            branchId,
          },
          token: 'coopeca-demo-token-' + Math.random().toString(36).substring(2, 15),
          role,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          sessionId: 'demo-' + Date.now(),
        };
        storedSession = session;
        saveStoredSession(session);
        return session;
      }

      // Mode réel : appeler l'API backend
      const response = await fetch('http://10.0.2.2:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Échec de l\'authentification');
      }

      storedSession = {
        user: {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          branchId: data.user.branchId,
        },
        token: data.token,
        role: data.user.role,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        sessionId: data.sessionId,
      };
      saveStoredSession(storedSession);
      return storedSession;
    },
    logout: async () => {
      storedSession = null;
      clearStoredSession();
    },
  };

  return service;
})();

export default authService;
