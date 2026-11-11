import { Redirect } from 'expo-router';

/**
 * Point d'entrée de l'application COOPECA.
 *
 * La racine `/` redirige vers l'écran de connexion `(auth)/login`.
 *
 * Après authentification réussie, le `LoginController` remplace la route par
 * `/(tabs)`, ce qui ouvre les écrans métier : accueil, clients, dossiers,
 * collectes, remises et clôture. L'onglet `(tabs)` vérifie la session avant
 * d'afficher les écrans et redirige vers `/(auth)/login` si aucune session
 * n'est confirmée.
 *
 * Ce fichier corrige la page blanche : sans `app/index.tsx`, la racine `/`
 * ne correspondait à aucune route et Expo Router ne rendait rien dans `#root`.
 */
export default function IndexScreen() {
  return <Redirect href="/(auth)/login" />;
}
