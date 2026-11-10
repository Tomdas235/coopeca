import { useCallback, useEffect, useState } from 'react';
const [dossiers, setDossiers] = useState([]);
  const [dossierIdChoisi, setDossierIdChoisi] = useState<string | null>(null);
  const [cycleActif, setCycleActif] = useState({ status: 'ACTIVE', fixedAmountXaf: 0, installmentCount: 0 });
  const [montant, setMontant] = useState('');
  const [chargement, setChargement] = useState(true);
  const [chargementCycle, setChargementCycle] = useState(false);
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recuOperation, setRecuOperation] = useState<{ transactionId: string; montant: number; numero: number } | null>(null);

  const chargerDossiers = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const session = await authenticationService.getCurrentSession();
      const branchId = session?.user?.branches?.[0]?.id;
      const resultat = await listDossiers({ status: 'OPEN', branchId, limit: 50 });
      setDossiers(resultat.items);
      if (resultat.items.length > 0 && !dossierIdChoisi) {
        setDossierIdChoisi(resultat.items[0].id);
      }
    } catch (err: unknown) {
      setErreur('Impossible de charger les dossiers ouverts.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void chargerDossiers();
  }, [chargerDossiers]);

  if (chargement) {
    return <LoadingState message="Chargement des collectes…" />;
  }

  if (erreur) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorMessage}>{erreur}</Text>
        <Button label="Réessayer" onPress={chargerDossiers} variant="secondary" />
      </View>
    );
  }

  let dossierCourant = dossiers.find((d) => d.id === dossierIdChoisi);
  if (!dossierIdChoisi || !dossierCourant) {
    return (
      <View style={styles.container}>
        <Text style={styles.titre}>Aucun dossier sélectionné</Text>
        <Text style={styles.sousTitre}>
          Veuillez sélectionner un dossier ouvert pour commencer une collecte.
        </Text>
        <Button label="Sélectionner un dossier" onPress={chargerDossiers} variant="primary" />
      </View>
    );
  }

  // Charger le cycle actif du dossier si pas encore chargé
  if (!chargementCycle && cycleActif.installmentCount === 0) {
    setChargementCycle(true);
    try {
      const cycle = await getCycle(dossierCourant.id);
      setCycleActif(cycle);
    } catch (e) {
      setErreur('Impossible de récupérer le cycle du dossier.');
    } finally {
      setChargementCycle(false);
    }
  }
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { FolderPlus, Calendar, Receipt, CheckCircle, ChevronRight } from 'lucide-react-native';
import { Badge, Button, Card, EmptyState, Input, LoadingState } from '../../src/components/ui';
import { colors, space } from '../../src/components/ui/colors';
import { listDossiers, depositToCycle, getCycle } from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';
import { formatMontantXAF } from '../../src/utils/montants';

export default function CollectesScreen() {
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  titre: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sousTitre: {
    color: colors.muted,
    fontSize: 14,
  },
  progressionBox: {
    marginBottom: 20,
  },
  progressionTitre: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  progressionContainer: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 8,
  },
  progressionTexte: {
    color: colors.muted,
    fontSize: 11,
  },
  saisieMontant: {
    marginBottom: 20,
  },
  labelMontant: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },
  actionZone: {
    marginTop: 20,
  },
  resultat: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.successSoft,
    borderRadius: 10,
  },
  resultatTitre: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultatDetails: {
    color: colors.text,
    fontSize: 13,
    marginBottom: 4,
  },
  resultatReference: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    marginTop: 16,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  errorMessage: {
    color: colors.text,
    fontSize: 13,
  },
});