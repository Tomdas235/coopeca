/**
 * Jeton d'accès courant (Bearer), partagé entre le service d'authentification
 * et le client HTTP.
 *
 * Ce module est volontairement isolé : `features/auth` importe `services/api`
 * pour ouvrir une session, donc `services/api` ne peut pas importer
 * `features/auth` sans créer un cycle de dépendances entre les deux modules.
 */
let accessToken: string | null = null;

/** Enregistre le jeton courant ; `null` ou une chaîne vide le supprime. */
export function setAccessToken(token: string | null): void {
  accessToken = token !== null && token.trim() !== '' ? token : null;
}

/** Jeton courant, ou `null` si aucune session n'est ouverte. */
export function getAccessToken(): string | null {
  return accessToken;
}
