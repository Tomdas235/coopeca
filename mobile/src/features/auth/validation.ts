export interface LoginFieldErrors {
  identifier?: string;
  password?: string;
}

export function validateLoginForm(identifier: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (identifier.trim().length === 0) {
    errors.identifier = "Saisissez votre identifiant.";
  }

  if (password.length === 0) {
    errors.password = 'Saisissez votre mot de passe.';
  }

  return errors;
}
