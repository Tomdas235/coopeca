import { Redirect, Tabs } from 'expo-router';
import { ClipboardCheck, Home, Receipt, Users, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AppScreen } from '../../src/components/AppScreen';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/components/theme';
import { authenticationService } from '../../src/features/auth';

interface TabIconProps {
  color: string;
  focused: boolean;
  size: number;
}

type TabIconComponent = typeof Home;

const tabIcon = (Icon: TabIconComponent) =>
  function TabIcon({ color, focused, size }: TabIconProps) {
    return (
      <Icon
        accessible={false}
        color={color}
        size={size}
        strokeWidth={focused ? 2.2 : 1.8}
      />
    );
  };

/**
 * Navigation principale COOPECA. Les routes dossiers et composants
 * restent accessibles depuis l'accueil sans occuper un onglet.
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
        tabBarIconStyle: { marginTop: 2 },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 14,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          minHeight: 48,
          justifyContent: 'center',
        },
        tabBarStyle: {
          minHeight: 64,
          paddingTop: 6,
          paddingBottom: 4,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarAccessibilityLabel: 'Accueil',
          tabBarIcon: tabIcon(Home),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarAccessibilityLabel: 'Clients',
          tabBarIcon: tabIcon(Users),
        }}
      />
      <Tabs.Screen
        name="collectes"
        options={{
          title: 'Collectes',
          tabBarAccessibilityLabel: 'Collectes',
          tabBarIcon: tabIcon(Receipt),
        }}
      />
      <Tabs.Screen
        name="remises"
        options={{
          title: 'Remises',
          tabBarAccessibilityLabel: 'Remises',
          tabBarIcon: tabIcon(Wallet),
        }}
      />
      <Tabs.Screen
        name="cloture"
        options={{
          title: 'Clôture',
          tabBarAccessibilityLabel: 'Clôture journalière',
          tabBarIcon: tabIcon(ClipboardCheck),
        }}
      />
      <Tabs.Screen name="dossiers" options={{ href: null }} />
      <Tabs.Screen name="composants" options={{ href: null }} />
    </Tabs>
  );
}
