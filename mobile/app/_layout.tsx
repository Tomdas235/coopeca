import { Stack } from 'expo-router';

/**
 * Racine de la navigation COOPECA (Expo Router).
 *
 * Trois branches : (auth) = connexion, (tabs) = écrans métier,
 * recus/[id] = détail d'un reçu numérique.
 *
 * Aucun garde d'authentification à ce stade : le module auth n'est pas
 * implémenté et ne doit pas être présenté comme fonctionnel
 * (cf. docs/DECISIONS_METIER.md, points À VALIDER).
 */
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ title: 'Connexion' }} />
      <Stack.Screen name="(tabs)" options={{ title: 'COOPECA' }} />
      <Stack.Screen name="recus/[id]" options={{ title: 'Reçu' }} />
    </Stack>
  );
}
