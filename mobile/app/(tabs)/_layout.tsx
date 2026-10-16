import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, type ColorValue } from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/components/theme';
import { authenticationService } from '../../src/features/auth';

const icone = (glyphe: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 16 }}>{glyphe}</Text>;
  };

/**
 * Navigation principale COOPECA. Les dossiers sont accessibles depuis
 * l'accueil mais restent hors de la barre pour préserver les cinq onglets.
 */
export default function TabsLayout() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionConfirmed, setSessionConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    void authenticationService
      .getCurrentSession()
      .then((session) => {
        if (active) {
          setSessionConfirmed(session !== null);
          setSessionChecked(true);
        }
      })
      .catch(() => {
        if (active) {
          setSessionConfirmed(false);
          setSessionChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!sessionChecked) {
    return (
      <AppScreen>
        <StatusPill kind="unknown" label="Vérification de la session" />
      </AppScreen>
    );
  }

  if (!sessionConfirmed) {
    return <Redirect href="/(auth)/login" />;
  }

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
