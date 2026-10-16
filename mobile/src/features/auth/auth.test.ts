import { LoginController } from './LoginController';
import { SessionController } from './SessionController';
import {
  AuthenticationUnavailableError,
  type AuthenticationService,
  type AuthSession,
} from './index';
import { validateLoginForm } from './validation';

const sessionForTest: AuthSession = {
  profile: {
    identity: 'Agent de test',
    roles: ['Agent'],
    agency: 'Agence de test',
  },
};

function makeService(overrides: Partial<AuthenticationService> = {}): AuthenticationService {
  return {
    authenticate: jest.fn().mockResolvedValue(sessionForTest),
    getCurrentSession: jest.fn().mockResolvedValue(sessionForTest),
    logout: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('validation locale de connexion', () => {
  it('signale séparément les champs obligatoires vides', () => {
    expect(validateLoginForm('', '')).toEqual({
      identifier: 'Saisissez votre identifiant.',
      password: 'Saisissez votre mot de passe.',
    });
  });

  it("ne définit pas de format d'identifiant ou de mot de passe", () => {
    expect(validateLoginForm('agent 01', ' ')).toEqual({});
    expect(validateLoginForm('   ', 'secret')).toEqual({
      identifier: 'Saisissez votre identifiant.',
    });
  });
});

describe('LoginController', () => {
  it('conserve le masquage initial et permet d’afficher puis masquer le mot de passe', () => {
    const controller = new LoginController(makeService());

    expect(controller.getSnapshot().passwordVisible).toBe(false);
    controller.togglePasswordVisibility();
    expect(controller.getSnapshot().passwordVisible).toBe(true);
    controller.togglePasswordVisibility();
    expect(controller.getSnapshot().passwordVisible).toBe(false);
  });

  it('ne soumet pas des champs vides et expose les erreurs près des champs', async () => {
    const service = makeService();
    const controller = new LoginController(service);
    const onAuthenticated = jest.fn();

    await controller.submit(onAuthenticated);

    expect(service.authenticate).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(controller.getSnapshot().fieldErrors).toEqual({
      identifier: 'Saisissez votre identifiant.',
      password: 'Saisissez votre mot de passe.',
    });
  });

  it('refuse les soumissions multiples et expose puis termine le chargement', async () => {
    let resolveAuthentication: (session: AuthSession) => void = () => {};
    const authenticate = jest.fn(
      () =>
        new Promise<AuthSession>((resolve) => {
          resolveAuthentication = resolve;
        }),
    );
    const controller = new LoginController(makeService({ authenticate }));
    controller.setIdentifier('agent');
    controller.setPassword('mot-de-passe');
    const onAuthenticated = jest.fn();

    const firstSubmission = controller.submit(onAuthenticated);
    expect(controller.getSnapshot().isSubmitting).toBe(true);

    await controller.submit(onAuthenticated);
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(onAuthenticated).not.toHaveBeenCalled();

    resolveAuthentication(sessionForTest);
    await firstSubmission;

    expect(onAuthenticated).toHaveBeenCalledWith(sessionForTest);
    expect(controller.getSnapshot().isSubmitting).toBe(false);
    expect(controller.getSnapshot().password).toBe('');
  });

  it("signale l'indisponibilité sans exposer les identifiants ni ouvrir de session", async () => {
    const controller = new LoginController(
      makeService({
        authenticate: jest.fn().mockRejectedValue(new AuthenticationUnavailableError()),
      }),
    );
    controller.setIdentifier('identifiant-confidentiel');
    controller.setPassword('mot-de-passe-confidentiel');
    const onAuthenticated = jest.fn();

    await controller.submit(onAuthenticated);

    const state = controller.getSnapshot();
    expect(state.serviceError).toContain("n'est pas configuré");
    expect(state.serviceError).not.toContain('identifiant-confidentiel');
    expect(state.serviceError).not.toContain('mot-de-passe-confidentiel');
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(state.isSubmitting).toBe(false);
  });

  it('remplace les erreurs techniques par un message réseau sans divulguer leur contenu', async () => {
    const controller = new LoginController(
      makeService({
        authenticate: jest.fn().mockRejectedValue(new Error('token=secret-detail')),
      }),
    );
    controller.setIdentifier('agent');
    controller.setPassword('secret-detail');

    await controller.submit(jest.fn());

    expect(controller.getSnapshot().serviceError).toBe(
      'Impossible de vérifier les identifiants. Vérifiez votre connexion et réessayez.',
    );
    expect(controller.getSnapshot().serviceError).not.toContain('secret-detail');
  });
});

describe('SessionController', () => {
  it('expose le chargement puis uniquement le profil retourné par le service', async () => {
    let resolveSession: (session: AuthSession | null) => void = () => {};
    const getCurrentSession = jest.fn(
      () =>
        new Promise<AuthSession | null>((resolve) => {
          resolveSession = resolve;
        }),
    );
    const controller = new SessionController(makeService({ getCurrentSession }));
    const loading = controller.load();

    expect(controller.getSnapshot().status).toBe('loading');
    resolveSession(sessionForTest);
    await loading;

    expect(controller.getSnapshot()).toMatchObject({
      status: 'authenticated',
      session: sessionForTest,
      error: null,
    });
  });

  it('distingue l’absence de session du service indisponible', async () => {
    const noSession = new SessionController(
      makeService({ getCurrentSession: jest.fn().mockResolvedValue(null) }),
    );
    await noSession.load();
    expect(noSession.getSnapshot().status).toBe('anonymous');

    const unavailable = new SessionController(
      makeService({
        getCurrentSession: jest.fn().mockRejectedValue(new AuthenticationUnavailableError()),
      }),
    );
    await unavailable.load();
    expect(unavailable.getSnapshot().status).toBe('unavailable');
    expect(unavailable.getSnapshot().error).toContain('Aucun profil');
  });

  it('déconnecte uniquement après confirmation de service', async () => {
    const service = makeService();
    const controller = new SessionController(service);
    await controller.load();
    const onLoggedOut = jest.fn();

    await controller.logout(onLoggedOut);

    expect(service.logout).toHaveBeenCalledTimes(1);
    expect(onLoggedOut).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toMatchObject({
      status: 'anonymous',
      session: null,
      isLoggingOut: false,
    });
  });

  it('conserve la session et affiche une erreur si la déconnexion échoue', async () => {
    const controller = new SessionController(
      makeService({ logout: jest.fn().mockRejectedValue(new Error('internal secret')) }),
    );
    await controller.load();
    const onLoggedOut = jest.fn();

    await controller.logout(onLoggedOut);

    expect(controller.getSnapshot().status).toBe('authenticated');
    expect(controller.getSnapshot().session).toBe(sessionForTest);
    expect(controller.getSnapshot().error).toBe(
      'Impossible de terminer la déconnexion. Réessayez.',
    );
    expect(onLoggedOut).not.toHaveBeenCalled();
  });
});
