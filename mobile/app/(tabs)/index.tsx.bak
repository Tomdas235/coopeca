import { useRouter } from 'expo-router';
import { Blocks, ClipboardCheck, Folder, Receipt, UserRound, Users, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ActionCard } from '../../src/components/ActionCard';
import { AppButton } from '../../src/components/AppButton';
import { AppCard } from '../../src/components/AppCard';
import { AppNotice } from '../../src/components/AppNotice';
import { AppScreen } from '../../src/components/AppScreen';
import { SyncStatusBanner } from '../../src/components/SyncStatusBanner';
import { colors } from '../../src/components/theme';

export default function AccueilScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COOPECA · ESPACE AGENT</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Bonjour
        </Text>
        <Text style={styles.subtitle}>Choisissez l’écran de travail à ouvrir.</Text>
      </View>

      <AppNotice
        title="Suivi d’activité indisponible"
        body="Aucune statistique fiable n’est connectée pour le moment. Les chiffres seront affichés uniquement quand une source réelle sera disponible."
        kind="info"
      />

      <SyncStatusBanner />

      <AppCard>
        <Text style={styles.actionEyebrow}>ACTION PRINCIPALE</Text>
        <Text style={styles.actionTitle}>Clients</Text>
        <Text style={styles.actionDescription}>
          Accéder à la liste pour retrouver ou créer un client.
        </Text>
        <AppButton
          label="Ouvrir les clients"
          onPress={() => router.push('/(tabs)/clients')}
        />
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <ActionCard
          title="Dossiers"
          description="Consulter ou créer un dossier"
        />
        <ActionCard
          title="Cycles"
          description="Nouveau produit à 31 versements"
          icon={<Wallet size={20} color={colors.accent} strokeWidth={1.8} />}
          onPress={() => router.push('/(tabs)/cycles')}>
        <ActionCard
          title="Collectes"
          description="Parcours legacy des collectes journalières"
          icon={<Folder size={20} color={colors.accent} strokeWidth={1.8} />}
          onPress={() => router.push('/(tabs)/dossiers')}
        />
        <ActionCard
          title="Collectes"
          description="Parcours legacy des collectes journalières"
          icon={<Receipt size={20} color={colors.accent} strokeWidth={1.8} />}
          onPress={() => router.push('/(tabs)/collectes')}
        />
        <ActionCard
          title="Remises"
          description="Parcours legacy des remises (reversements)"
          icon={<Wallet size={20} color={colors.accent} strokeWidth={1.8} />}
          onPress={() => router.push('/(tabs)/remises')}
        />
        <ActionCard
          title="Clôture"
          description="Ancienne clôture — module en préparation"
          icon={<ClipboardCheck size={20} color={colors.accent} strokeWidth={1.8} />}
          onPress={() => router.push('/(tabs)/cloture')}
        />
      </View>

      <AppNotice
        title="Parcours financier"
        body="Les collectes, remises et clôtures affichées ici sont des parcours legacy. Elles ne représentent pas les versements ou retraits des nouveaux cycles."
        kind="warning"
      />

      <View style={styles.secondarySection}>
        <Text style={styles.secondaryTitle}>Autres accès</Text>
        <ActionCard
          title="Session et profil"
          description="Consulter la session sur cet appareil"
          icon={<UserRound size={20} color={colors.accent} strokeWidth={1.8} />}
          onPress={() => router.push('/(auth)/session')}
        />
        <ActionCard
          title="Composants UI"
          description="Vitrine des composants de l’interface"
          icon={<Blocks size={20} color={colors.accent} strokeWidth={1.8} />}
          onPress={() => router.push('/(tabs)/composants')}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 6,
    paddingTop: 4,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  actionEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  actionDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  secondarySection: {
    gap: 10,
    paddingTop: 4,
  },
  secondaryTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
});
