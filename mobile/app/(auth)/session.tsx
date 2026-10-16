import { useRouter } from 'expo-router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/components/theme';
import { authenticationService } from '../../src/features/auth';
import { SessionController } from '../../src/features/auth/SessionController';

export default function SessionScreen() {
  const router = useRouter();
  const [controller] = useState(() => new SessionController(authenticationService));
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => {
    void controller.load();
  }, [controller]);

  const confirmerDeconnexion = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous terminer cette session sur cet appareil ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          void controller.logout(() => router.replace('/(auth)/login'));
        },
      },
    ]);
  };

  const profile = state.session?.profile;
  const hasProfileDetails = Boolean(
    profile?.identity || profile?.agency || (profile?.roles && profile.roles.length > 0),
  );

  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COMPTE</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Session et profil
        </Text>
        <Text style={styles.subtitle}>État de la session sur cet appareil.</Text>
      </View>

      <View style={styles.card}>
        {state.status === 'loading' ? (
          <>
            <StatusPill kind="unknown" label="Vérification en cours" />
            <Text style={styles.body}>Vérification de la session auprès du service disponible.</Text>
          </>
        ) : state.status === 'authenticated' && state.session ? (
          <>
            <StatusPill kind="online" label="Session confirmée" />
            <Text style={styles.cardTitle}>Profil</Text>
            {profile?.identity ? <ProfileRow label="Identité" value={profile.identity} /> : null}
            {profile?.agency ? <ProfileRow label="Agence" value={profile.agency} /> : null}
            {profile?.roles && profile.roles.length > 0 ? (
              <ProfileRow label="Rôles" value={profile.roles.join(', ')} />
            ) : null}
            {!hasProfileDetails ? (
              <Text style={styles.body}>
                Aucune information de profil n’a été fournie par le service.
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: state.isLoggingOut }}
              disabled={state.isLoggingOut}
              onPress={confirmerDeconnexion}
              style={[styles.logoutButton, state.isLoggingOut && styles.buttonDisabled]}
            >
              <Text style={styles.logoutText}>
                {state.isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
              </Text>
            </Pressable>
          </>
        ) : state.status === 'anonymous' ? (
          <>
            <StatusPill kind="offline" label="Aucune session active" />
            <Text style={styles.body}>Connectez-vous pour consulter un profil.</Text>
          </>
        ) : (
          <>
            <StatusPill kind="error" label="Session indisponible" />
            <Text accessibilityLiveRegion="polite" style={styles.body}>
              {state.error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void controller.load()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Réessayer</Text>
            </Pressable>
          </>
        )}

        {state.error && state.status === 'authenticated' ? (
          <View accessibilityLiveRegion="assertive" style={styles.errorBox}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/(auth)/login')}
        style={styles.backButton}
      >
        <Text style={styles.backText}>Retour à la connexion</Text>
      </Pressable>
    </AppScreen>
  );
}

interface ProfileRowProps {
  label: string;
  value: string;
}

function ProfileRow({ label, value }: ProfileRowProps) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 7,
    paddingTop: 4,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  card: {
    gap: 15,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 18,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  profileRow: {
    gap: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  profileLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  profileValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  secondaryText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
