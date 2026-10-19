import { useRouter, useState } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InputMontantXAF } from '../../src/components/InputMontantXAF';
import { DialogConfirmation } from '../../src/components/DialogConfirmation';
import { ActionCard } from '../../src/components/ActionCard';
import { AppScreen } from '../../src/components/AppScreen';
import { MetricCard } from '../../src/components/MetricCard';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/components/theme';
import { indicateursDemonstration } from '../../src/features/accueil';
import { formatMontantXAF } from '../../src/utils/montants';

export default function AccueilScreen() {
  const router = useRouter();
  const [montantSaisie, setMontantSaisie] = useState<string>('');
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  return (
    <AppScreen>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>COOPECA · ESPACE AGENT</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Bonjour
          </Text>
          <Text style={styles.subtitle}>Votre activité, en un coup d’œil.</Text>
        </View>
        <StatusPill kind="unknown" label="APERÇU DÉMO" />
      </View>

      <View style={styles.demoNotice}>
        <Text style={styles.noticeTitle}>Données de démonstration</Text>
        <Text style={styles.noticeBody}>
          Ces chiffres et statuts sont illustratifs. La connexion et la synchronisation réelles ne
          sont pas configurées.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Aperçu d’activité</Text>
          <Text style={styles.sectionCaption}>Exemple uniquement</Text>
        </View>
        <View style={styles.metrics}>
          <MetricCard label="Clients" value={String(indicateursDemonstration.clients)} />
          <MetricCard label="Dossiers actifs" value={String(indicateursDemonstration.dossiers)} />
          <MetricCard label="Collectes du jour" value={String(indicateursDemonstration.collectes)} />
          <MetricCard
            label="Montant collecté"
            value={formatMontantXAF(indicateursDemonstration.montantCollecte)}
            note="Montant entier XAF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État réseau et synchronisation</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>En ligne</Text>
              <Text style={styles.statusDescription}>Exemple d’état de connexion</Text>
            </View>
            <StatusPill kind="online" label="En ligne" />
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Hors ligne</Text>
              <Text style={styles.statusDescription}>Exemple d’état de connexion</Text>
            </View>
            <StatusPill kind="offline" label="Hors ligne" />
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Synchronisation en attente</Text>
              <Text style={styles.statusDescription}>Exemple d’opération non confirmée</Text>
            </View>
            <StatusPill kind="pending" label="En attente" />
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Erreur</Text>
              <Text style={styles.statusDescription}>Exemple d’état nécessitant une action</Text>
            </View>
            <StatusPill kind="error" label="Erreur" />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saisie de montant (démo)</Text>
        <InputMontantXAF
          label="Montant à collecter"
          value={montantSaisie}
          onChangeText={setMontantSaisie}
          placeholder="0"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confirmation d’action (démo)</Text>
        <Pressable
          style={styles.demoButton}
          onPress={() => {
            setActionResult(null);
            setShowDialog(true);
          }}
        >
          <Text style={styles.demoButtonText}>Clôturer la journée (démo)</Text>
        </Pressable>
        {actionResult ? (
          <AppNotice
            title={actionResult === 'confirmé' ? 'Action confirmée' : 'Action annulée'}
            body={
              actionResult === 'confirmé'
                ? 'La clôture a été enregistrée (démonstration).'
                : 'L’opération a été annulée par l’utilisateur.'
            }
            kind={actionResult === 'confirmé' ? 'success' : 'info'}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <ActionCard
          title="Clients"
          description="Consulter et gérer les clients"
          symbol="C"
          onPress={() => router.push('/(tabs)/clients')}
        />
        <ActionCard
          title="Dossiers"
          description="Consulter les dossiers de tontine"
          symbol="D"
          onPress={() => router.push('/(tabs)/dossiers')}
        />
        <ActionCard
          title="Collectes"
          description="Suivre les collectes journalières"
          symbol="＋"
          onPress={() => router.push('/(tabs)/collectes')}
        />
        <ActionCard
          title="Reversements"
          description="Déclarations de remise de fonds"
          symbol="↗"
          onPress={() => router.push('/(tabs)/remises')}
        />
        <ActionCard
          title="Clôture"
          description="Consulter la clôture journalière"
          symbol="✓"
          onPress={() => router.push('/(tabs)/cloture')}
        />
        <ActionCard
          title="Session et profil"
          description="Consulter le compte et se déconnecter"
          symbol="•"
          onPress={() => router.push('/(auth)/session')}
        />
        <ActionCard
          title="Composants UI"
          description="Vitrine des composants de l'interface"
          symbol="🧩"
          onPress={() => router.push('/(tabs)/composants')}
        />
      </View>

      <DialogConfirmation
        visible={showDialog}
        title="Clôturer la journée ?"
        message="Cette action est irréversible en démonstration."
        confirmLabel="Oui, clôturer"
        cancelLabel="Non, annuler"
        destructive
        onConfirm={() => {
          setActionResult('confirmé');
          setShowDialog(false);
        }}
        onCancel={() => {
          setActionResult('annulé');
          setShowDialog(false);
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 14,
    paddingTop: 4,
  },
  headingCopy: {
    gap: 5,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
  },
  demoNotice: {
    gap: 5,
    borderRadius: 13,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 14,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: 11,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCaption: {
    color: colors.muted,
    fontSize: 11,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusCard: {
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  statusDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  demoButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
