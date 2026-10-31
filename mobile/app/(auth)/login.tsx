import { useRouter } from 'expo-router';
import { useRef, useState, useSyncExternalStore, type ElementRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionCard } from '../../src/components/ActionCard';
import { AppScreen } from '../../src/components/AppScreen';
import { colors } from '../../src/components/theme';
import { authenticationService } from '../../src/features/auth';
import { LoginController } from '../../src/features/auth/LoginController';

export default function LoginScreen() {
  const router = useRouter();
  const [controller] = useState(() => new LoginController(authenticationService));
  const passwordRef = useRef<ElementRef<typeof TextInput>>(null);
  const form = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  const soumettre = () => {
    void controller.submit(() => router.replace('/(tabs)'));
  };

  return (
    <AppScreen>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandInitials}>C</Text>
        </View>
        <Text style={styles.brandName}>COOPECA</Text>
        <Text style={styles.brandSubtitle}>Espace agent</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.titleBlock}>
          <Text accessibilityRole="header" style={styles.title}>
            Connexion
          </Text>
          <Text style={styles.intro}>Saisissez vos identifiants pour accéder à votre espace.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Identifiant</Text>
          <TextInput
            accessibilityLabel="Identifiant"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!form.isSubmitting}
            onChangeText={(value) => controller.setIdentifier(value)}
            onSubmitEditing={() => passwordRef.current?.focus()}
            returnKeyType="next"
            style={[styles.input, form.fieldErrors.identifier ? styles.inputError : null]}
            textContentType="username"
            value={form.identifier}
          />
          {form.fieldErrors.identifier ? (
            <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
              {form.fieldErrors.identifier}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={[styles.passwordRow, form.fieldErrors.password ? styles.inputError : null]}>
            <TextInput
              accessibilityLabel="Mot de passe"
              autoCapitalize="none"
              editable={!form.isSubmitting}
              onChangeText={(value) => controller.setPassword(value)}
              onSubmitEditing={soumettre}
              ref={passwordRef}
              returnKeyType="go"
              secureTextEntry={!form.passwordVisible}
              style={styles.passwordInput}
              textContentType="password"
              value={form.password}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                form.passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
              }
              disabled={form.isSubmitting}
              onPress={() => controller.togglePasswordVisibility()}
              style={styles.visibilityButton}
            >
              <Text style={styles.visibilityText}>
                {form.passwordVisible ? 'Masquer' : 'Afficher'}
              </Text>
            </Pressable>
          </View>
          {form.fieldErrors.password ? (
            <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
              {form.fieldErrors.password}
            </Text>
          ) : null}
        </View>

        {form.serviceError ? (
          <View accessibilityLiveRegion="assertive" style={styles.errorBox}>
            <Text style={styles.errorText}>{form.serviceError}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: form.isSubmitting }}
          disabled={form.isSubmitting}
          onPress={soumettre}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && !form.isSubmitting ? styles.submitPressed : null,
            form.isSubmitting ? styles.submitDisabled : null,
          ]}
        >
          {form.isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitText}>Se connecter</Text>
          )}
        </Pressable>
        <Text style={styles.disclaimer}>
          L’accès aux fonctions métier nécessite une authentification confirmée par le serveur.
        </Text>
      </View>

      <ActionCard
        title="Session et profil"
        description="Consulter l’état de la session sur cet appareil"
        symbol="•"
        onPress={() => router.push('/(auth)/session')}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    gap: 5,
    paddingTop: 12,
    paddingBottom: 2,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brandInitials: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: '800',
  },
  brandName: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  card: {
    gap: 18,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 18,
  },
  titleBlock: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  intro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  statusBlock: {
    gap: 9,
    borderRadius: 12,
    backgroundColor: colors.warningSoft,
    padding: 12,
  },
  statusDescription: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  field: {
    gap: 7,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 16,
  },
  passwordRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  passwordInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  visibilityButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  visibilityText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
  },
  submitPressed: {
    opacity: 0.86,
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});
