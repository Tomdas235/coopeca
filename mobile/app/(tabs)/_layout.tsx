import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { colors } from '../../src/components/theme';

const icone = (glyphe: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 16 }}>{glyphe}</Text>;
  };

/**
 * Navigation principale COOPECA. Les dossiers sont accessibles depuis
 * l'accueil mais restent hors de la barre pour préserver les cinq onglets.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
        tabBarStyle: {
          height: 62,
          paddingTop: 6,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icone('🏠') }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: icone('👥') }} />
      <Tabs.Screen name="collectes" options={{ title: 'Collectes', tabBarIcon: icone('📒') }} />
      <Tabs.Screen name="remises" options={{ title: 'Remises', tabBarIcon: icone('💶') }} />
      <Tabs.Screen name="cloture" options={{ title: 'Clôture', tabBarIcon: icone('🔒') }} />
      <Tabs.Screen name="dossiers" options={{ href: null }} />
    </Tabs>
  );
}
