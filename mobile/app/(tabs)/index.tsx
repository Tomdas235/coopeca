import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Blocks,
  ClipboardCheck,
  Folder,
  Receipt,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ActionCard } from '../../src/components/ActionCard';
import { AppButton } from '../../src/components/AppButton';
import { AppCard } from '../../src/components/AppCard';
import { AppNotice } from '../../src/components/AppNotice';
import { AppScreen } from '../../src/components/AppScreen';
import { MetricCard } from '../../src/components/MetricCard';
import { SyncStatusBanner, type SyncDisplayState } from '../../src/components/SyncStatusBanner';
import { colors } from '../../src/components/theme';
import { listClients, listDossiers } from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';

export default function AccueilScreen() {
  const router = useRouter();

  const [nomAgent, setNomAgent] = useState('Agent');
  const [nbClients, setNbClients] = useState<number | null>(null);
  const [nbDossiers, setNbDossiers] = useState<number | null>(null);
  const [etatReseau, setEtatReseau] = useState<SyncDisplayState>('unknown');

  useEffect(() => {
    let monte = true;

    async function initialiserTableauBord() {
      try {
        const session = await authenticationService.getCurrentSession();
        if (session && monte) {
          setNomAgent(session.profile?.identity || session.user?.username || 'Agent');
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
        }
      }
    }

    void initialiserTableauBord();
    return () => {
      monte = false;
    };
  }, []);

  return (
    <AppScreen>
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

      {/* Cartes métriques réelles */}
      <View style={styles.grilleMetriques}>
        <MetricCard
          label="Clients enregistrés"
          value={nbClients !== null ? String(nbClients) : '…'}
          note="Portefeuille actif"
        />
        <MetricCard
          label="Dossiers ouverts"
          value={nbDossiers !== null ? String(nbDossiers) : '…'}
          note="Cycles de tontine"
        />
      </View>

      <AppCard>
        <Text style={styles.actionEyebrow}>PARCOURS PRINCIPAL</Text>
        <Text style={styles.actionTitle}>Gestion des Clients</Text>
        <Text style={styles.actionDescription}>
          Créer un nouveau client, retrouver un profil existant ou ouvrir son dossier.
        </Text>
        <AppButton
          label="Ouvrir les clients"
          onPress={() => router.push('/(tabs)/clients')}
        />
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <ActionCard
          title="Dossiers & Cycles"
          description="Consulter les dossiers et suivre la progression des 31 versements"
          icon={<Folder size={20} color={colors.primary} />}
          onPress={() => router.push('/(tabs)/dossiers')}
        />
        <ActionCard
          title="Enregistrer une collecte"
          description="Saisie directe d’un versement fixe sur cycle actif avec reçu officiel"
          icon={<Receipt size={20} color={colors.primary} />}
          onPress={() => router.push('/(tabs)/collectes')}
        />
        <ActionCard
          title="Cycles d'épargne"
          description="Consultation technique et gestion des cycles à 31 versements"
          icon={<Wallet size={20} color={colors.primary} />}
          onPress={() => router.push('/(tabs)/cycles')}
        />
      </View>

      <View style={styles.secondarySection}>
        <Text style={styles.secondaryTitle}>Modules d'audit et historiques</Text>
        <ActionCard
          title="Remises caisse (Legacy)"
          description="Consultation historique des anciennes remises de fonds"
          icon={<Wallet size={20} />}
          onPress={() => router.push('/(tabs)/remises')}
        />
        <ActionCard
          title="Clôture (En préparation)"
          description="Module de récapitulatif journalier de caisse en cours de cadrage"
          icon={<ClipboardCheck size={20} />}
          onPress={() => router.push('/(tabs)/cloture')}
        />
        <ActionCard
          title="Session & Profil agent"
          description="Identifiants, agence de rattachement et déconnexion"
          icon={<UserRound size={20} />}
          onPress={() => router.push('/(auth)/session')}
        />
        <ActionCard
          title="Composants UI"
          description="Vitrine des composants de l’interface COOPECA"
          icon={<Blocks size={20} />}
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
    marginTop: 8,
  },
  secondaryTitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
});
