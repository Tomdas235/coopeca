import {
  AuthenticationUnavailableError,
  type AuthenticationService,
  type AuthSession,
} from './index';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'unavailable' | 'error';

export interface SessionSnapshot {
  status: SessionStatus;
  session: AuthSession | null;
  isLoggingOut: boolean;
  error: string | null;
}

const initialSnapshot: SessionSnapshot = {
  status: 'loading',
  session: null,
  isLoggingOut: false,
  error: null,
};

export class SessionController {
  private snapshot = initialSnapshot;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly service: AuthenticationService) {}

  readonly getSnapshot = (): SessionSnapshot => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async load(): Promise<void> {
    this.update({ status: 'loading', session: null, error: null });

    try {
      const session = await this.service.getCurrentSession();
      this.update({
        status: session ? 'authenticated' : 'anonymous',
        session,
      });
    } catch (error) {
      this.update({
        status:
          error instanceof AuthenticationUnavailableError ? 'unavailable' : 'error',
        error:
          error instanceof AuthenticationUnavailableError
            ? "Le service d'authentification n'est pas configuré. Aucun profil ni aucune session ne sont disponibles."
            : 'Impossible de récupérer les informations de session. Réessayez.',
      });
    }
  }

  async logout(onLoggedOut: () => void): Promise<void> {
    if (this.snapshot.isLoggingOut || this.snapshot.status !== 'authenticated') {
      return;
    }

    this.update({ isLoggingOut: true, error: null });

    try {
      await this.service.logout();
    } catch (error) {
      this.update({
        error:
          error instanceof AuthenticationUnavailableError
            ? "La déconnexion réelle n'est pas disponible : le service d'authentification n'est pas configuré."
            : 'Impossible de terminer la déconnexion. Réessayez.',
      });
      this.update({ isLoggingOut: false });
      return;
    }

    this.update({
      status: 'anonymous',
      session: null,
      isLoggingOut: false,
    });
    onLoggedOut();
  }

  private update(changes: Partial<SessionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...changes };
    this.listeners.forEach((listener) => listener());
  }
}
