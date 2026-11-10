import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, Folder, Receipt, Users } from 'lucide-react-native';
import { Badge, Button, Card, LoadingState } from '../../src/components/ui';
import { colors } from '../../src/components/ui/colors';
import { listClients, listDossiers } from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';
import { SyncStatusBanner, type SyncDisplayState } from '../../src/components/SyncStatusBanner';

export default function AccueilAgentScreen() {
  const router = useRouter();

  const [nomAgent, setNomAgent] = useState<string>('Agent');
  const [nbClients, setNbClients] = useState<number | null>(null);
  const [nbDossiers, setNbDossiers] = useState<number | null>(null);
  const [etatReseau, setEtatReseau] = useState<SyncDisplayState>('unknown');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let monte = true;

    async function initialiserTableauBord() {
      setChargement(true);
      setErreur(null);
      try {
        const session = await authenticationService.getCurrentSession();
        if (session && monte) {
          setNomAgent(
            session.profile?.identity || session.user?.username || 'Agent',
          );
        }

        const [clientsRes, dossiersRes] = await Promise.all([
          listClients({ limit: 1 }),
          listDossiers({ limit: 1 }),
        ]);

        if (monte) {
          setNbClients(clientsRes.total);
          setNbDossiers(dossiersRes.total);
          setEtatReseau('online');
        }
      } catch (err: unknown) {
        if (monte) {
          setEtatReseau('offline');
          setErreur(
            'Impossible de charger les statistiques depuis le serveur. Vérifiez votre connexion.',
          );
        }
      } finally {
        if (monte) setChargement(false);
      }
    }

    void initialiserTableauBord();
    return () => {
      monte = false;
    };
  }, []);

  if (chargement) {
    return <LoadingState message="Chargement de l’accueil…" />;
  }

  if (erreur) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorMessage}>{erreur}</Text>
        <Button label="Réessayer" onPress={() => {}} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COOPECA · ESPACE AGENT</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Bonjour, {nomAgent}
        </Text>
        <Text style={styles.subtitle}>
          Collecte de tontine et suivi des cycles à 31 versements.
        </Text>
      </View>

      <SyncStatusBanner state={etatReseau} />

      <View style={styles.grilleMetriques}>
        <Card elevation="sm" padding={16} style={styles.metricCard}>
          <Text style={styles.metricLabel}>Clients enregistrés</Text>
          <Text style={styles.metricValue}>
            {nbClients !== null ? String(nbClients) : '—'}
          </Text>
          <Text style={styles.metricNote}>Portefeuille actif</Text>
        </Card>
        <Card elevation="sm" padding={16} style={styles.metricCard}>
          <Text style={styles.metricLabel}>Dossiers ouverts</Text>
          <Text style={styles.metricValue}>
            {nbDossiers !== null ? String(nbDossiers) : '—'}
          </Text>
          <Text style={styles.metricNote}>Cycles de tontine</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parcours principal</Text>
        <View style={styles.actionRow}>
          <ActionCardRef
            title="Clients"
            description="Créer, rechercher et consulter vos clients"
            icon={<Users size={20} color={colors.primary} />}
            onPress={() => router.push('/(tabs)/clients')}
          />
          <ActionCardRef
            title="Dossiers"
            description="Suivre la progression des 31 versements"
            icon={<Folder size={20} color={colors.primary} />}
            onPress={() => router.push('/(tabs)/dossiers')}
          />
          <ActionCardRef
            title="Collectes"
            description="Enregistrer un versement fixe sur cycle actif"
            icon={<Receipt size={20} color={colors.primary} />}
            onPress={() => router.push('/(tabs)/collectes')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <View style={styles.actionRow}>
          <ActionCardRef
            title="Menu agent"
            description="Profil, synchronisation, paramètres, aide, déconnexion"
            icon={<Calendar size={20} color={colors.primary} />}
            onPress={() => router.push('/(tabs)/menu')}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Badge kind="non_mesure" label="SYNC NON MESURÉ" />
        <Text style={styles.footerText}>
          Les statistiques proviennent du serveur COOPECA. Aucun chiffre n’est simulé.
        </Text>
      </View>
    </View>
  );
}

function ActionCardRef({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: React.ReactElement;
  onPress: () => void;
}) {
  return (
    <Card elevation="sm" padding={14} style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionCardContent}>
        <View style={styles.actionCardIcon}>{icon}</View>
        <View style={styles.actionCardCopy}>
          <Text style={styles.actionCardTitle}>{title}</Text>
          <Text style={styles.actionCardDesc}>{description}</Text>
        </View>
        <View style={styles.actionCardChevron}>
          <Text style={styles.actionCardChevronText}>›</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    gap: 6,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  grilleMetriques: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    minHeight: 104,
    justifyContent: 'center',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  metricNote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionRow: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  actionCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardCopy: {
    flex: 1,
    gap: 2,
  },
  actionCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  actionCardDesc: {
    color: colors.muted,
    fontSize: 12,
  },
  actionCardChevron: {
    width: 24,
    height: 24,
    alignItems: 'center',
  },
  actionCardChevronText: {
    color: colors.muted,
    fontSize: 20,
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  footerText: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
});
