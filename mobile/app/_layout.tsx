import { Stack } from 'expo-router';

/**
 * Racine de la navigation COOPECA (Expo Router).
 *
 * Trois branches : (auth) = connexion, (tabs) = écrans métier,
 * recus/[id] = détail d'un reçu numérique.
 *
 * L'authentification réelle ou démo est gérée par le service auth; le groupe
 * tabs vérifie la session avant d'afficher les écrans métier.
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
