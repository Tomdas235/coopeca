import { validateEnv } from './env.validation';

describe('validateEnv (configuration)', () => {
  const base = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/coopeca?schema=public',
    JWT_SECRET: 'test-only-secret-with-at-least-32-characters',
  };

  it('accepte une configuration valide', () => {
    const env = validateEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('test');
  });

  it('refuse une DATABASE_URL absente sans afficher le mot de passe', () => {
    const { DATABASE_URL: _omit, ...withoutDb } = base;
    let thrown: unknown;
    try {
      validateEnv(withoutDb);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).toContain('DATABASE_URL');
    expect(message).not.toContain('pass');
  });

  it('refuse une DATABASE_URL qui n\'est pas une URL PostgreSQL', () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: 'mysql://x' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('refuse un secret JWT trop court', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('refuse un PORT hors plage valide', () => {
    expect(() => validateEnv({ ...base, PORT: '0' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...base, PORT: '70000' })).toThrow(/PORT/);
  });

  it('applique les valeurs par défaut pour PORT et NODE_ENV', () => {
    const env = validateEnv({
      DATABASE_URL: base.DATABASE_URL,
    });
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
  });
});
