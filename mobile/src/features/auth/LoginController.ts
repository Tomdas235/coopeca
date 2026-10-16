import {
  AuthenticationUnavailableError,
  type AuthenticationService,
  type AuthSession,
} from './index';
import { validateLoginForm, type LoginFieldErrors } from './validation';

export interface LoginSnapshot {
  identifier: string;
  password: string;
  passwordVisible: boolean;
  isSubmitting: boolean;
  fieldErrors: LoginFieldErrors;
  serviceError: string | null;
}

const initialSnapshot: LoginSnapshot = {
  identifier: '',
  password: '',
  passwordVisible: false,
  isSubmitting: false,
  fieldErrors: {},
  serviceError: null,
};

export class LoginController {
  private snapshot = initialSnapshot;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly service: AuthenticationService) {}

  readonly getSnapshot = (): LoginSnapshot => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setIdentifier(identifier: string): void {
    this.update({
      identifier,
      fieldErrors: { ...this.snapshot.fieldErrors, identifier: undefined },
      serviceError: null,
    });
  }

  setPassword(password: string): void {
    this.update({
      password,
      fieldErrors: { ...this.snapshot.fieldErrors, password: undefined },
      serviceError: null,
    });
  }

  togglePasswordVisibility(): void {
    this.update({ passwordVisible: !this.snapshot.passwordVisible });
  }

  async submit(onAuthenticated: (session: AuthSession) => void): Promise<void> {
    if (this.snapshot.isSubmitting) {
      return;
    }

    const fieldErrors = validateLoginForm(this.snapshot.identifier, this.snapshot.password);
    if (Object.keys(fieldErrors).length > 0) {
      this.update({ fieldErrors, serviceError: null });
      return;
    }

    this.update({ isSubmitting: true, fieldErrors: {}, serviceError: null });

    try {
      const session = await this.service.authenticate({
        identifier: this.snapshot.identifier,
        password: this.snapshot.password,
      });
      this.update({ password: '' });
      onAuthenticated(session);
    } catch (error) {
      this.update({
        serviceError:
          error instanceof AuthenticationUnavailableError
            ? "La connexion réelle n'est pas disponible : le service d'authentification n'est pas configuré. Aucune session n'a été ouverte."
            : 'Impossible de vérifier les identifiants. Vérifiez votre connexion et réessayez.',
      });
    } finally {
      this.update({ isSubmitting: false });
    }
  }

  private update(changes: Partial<LoginSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...changes };
    this.listeners.forEach((listener) => listener());
  }
}
