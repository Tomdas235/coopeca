import { ScreenPlaceholder } from '../../src/components/ScreenPlaceholder';

/**
 * Écran de connexion — squelette uniquement.
 *
 * Aucune authentification n'est implémentée : pas de formulaire actif,
 * pas de session, pas de jeton. Durée de session, chiffrement et
 * procédure de récupération d'un appareil perdu restent À VALIDER
 * (docs/DECISIONS_METIER.md §4).
 */
export default function LoginScreen() {
  return (
    <ScreenPlaceholder
      titre="Connexion"
      description="Authentification non implémentée (squelette). Aucun contrôle d'accès n'est actif à ce stade."
    />
  );
}
