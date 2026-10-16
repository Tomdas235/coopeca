import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

const icone = (glyphe: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 16 }}>{glyphe}</Text>;
  };

/**
 * Navigation principale COOPECA — 5 onglets imposés par la structure
 * de référence (app/(tabs)/). Aucun écran n'expose de données métier
 * à ce stade : tous sont des squelettes.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('🏠') }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: icone('👥') }} />
      <Tabs.Screen name="collectes" options={{ title: 'Collectes', tabBarIcon: icone('📒') }} />
      <Tabs.Screen name="remises" options={{ title: 'Remises', tabBarIcon: icone('💶') }} />
      <Tabs.Screen name="cloture" options={{ title: 'Clôture', tabBarIcon: icone('🔒') }} />
    </Tabs>
  );
}
