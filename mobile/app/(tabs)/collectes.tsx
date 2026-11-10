import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, Input, LoadingState } from '../../src/components/ui';
import { colors } from '../../src/components/ui/colors';
import { listDossiers, listDossierCycles, depositToCycle } from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';
import { formatMontantXAF, exigerEntier } from '../../src/utils/montants';

export default function CollectesScreen() {
  const router = useRouter();

  const [dossiers, setDossiers] = useState<Array<{ id: string; dossierNo: string; client?: { fullName?: string; clientCode?: string } }>>([]);
  const [dossierIdChoisi, setDossierIdChoisi] = useState<string | null>(null);
  const [cycle, setCycle] = useState<{ id: string; fixedAmountXaf: string; installmentCount: number; targetInstallments: number; status: string } | null>(null);
  const [montant, setMontant] = useState('');
  const [chargement, setChargement] = useState(true);
  const [chargementCycle, setChargementCycle] = useState(false);
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recuOperation, setRecuOperation] = useState<{ transactionId: string; montant: number } | null>(null);

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
  }, [dossierIdChoisi]);

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

  if (dossiers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titre}>Nouvelle collecte</Text>
          <Text style={styles.sousTitre}>
            Aucun dossier ouvert n’est disponible pour enregistrer un versement.
          </Text>
        </View>
        <Button label="Retour" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const dossierCourant = dossiers.find((d) => d.id === dossierIdChoisi);

  if (!dossierIdChoisi || !dossierCourant) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titre}>Nouvelle collecte</Text>
          <Text style={styles.sousTitre}>
            Veuillez sélectionner un dossier ouvert pour commencer une collecte.
          </Text>
        </View>
        <Button label="Sélectionner un dossier" onPress={chargerDossiers} variant="primary" />
      </View>
    );
  }

  // Charger le cycle actif du dossier si pas encore chargé
  useEffect(() => {
    let active = true;
    async function chargerCycle() {
      if (!dossierCourant) return;
      if (!dossierCourant.id) return;
      setChargementCycle(true);
      try {
        const cycles = await listDossierCycles(dossierCourant!.id);
        const actif = cycles.find((c) => c.status === 'ACTIVE');
        if (active) {
          setCycle(
            actif
              ? {
                  id: actif.id,
                  fixedAmountXaf: actif.fixedAmountXaf,
                  installmentCount: actif.installmentCount,
                  targetInstallments: actif.targetInstallments,
                  status: actif.status,
                }
              : null,
          );
          if (!montant && actif) {
            setMontant(actif.fixedAmountXaf);
          }
        }
      } catch {
        if (active) setErreur('Impossible de récupérer le cycle du dossier.');
      } finally {
        if (active) setChargementCycle(false);
      }
    }
    void chargerCycle();
    return () => { active = false };
  }, [dossierCourant.id, montant]);

  if (!cycle && !chargementCycle) {
    setCycle(null);
  }

  async function enregistrerCollecte() {
    setErreur(null);
    setRecuOperation(null);
    if (!cycle) return;
    const montantEntier = Number.parseInt(montant, 10);
    if (!Number.isInteger(montantEntier) || montantEntier <= 0) {
      setErreur('Le montant doit être un entier positif (XAF).');
      return;
    }
    try {
      exigerEntier(montantEntier, 'enregistrerCollecte');
      setSoumissionEnCours(true);
      const resultat = await depositToCycle(cycle.id, montantEntier);
      setRecuOperation({ transactionId: resultat.transactionId, montant: montantEntier });
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : 'Impossible d’enregistrer le versement.',
      );
    } finally {
      setSoumissionEnCours(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.titre}>Nouvelle collecte</Text>
          <Text style={styles.sousTitre}>
            Enregistrez un versement fixe sur le cycle à 31 versements.
          </Text>
        </View>
        <Button label="Retour" onPress={() => router.back()} variant="secondary" />
      </View>

      <View style={styles.selectionBox}>
        <Text style={styles.label}>Dossier</Text>
        <View style={styles.selectField}>
          <Text style={styles.selectValue}>
            {dossierCourant.dossierNo}
            {dossierCourant.client ? ` · ${dossierCourant.client.fullName || dossierCourant.client.clientCode || ''}` : ''}
          </Text>
        </View>
        <Text style={styles.selectHint}>
          Appuyez sur « Changer de dossier » pour choisir un autre dossier ouvert.
        </Text>
        <Button
          label="Changer de dossier"
          variant="ghost"
          onPress={() => setDossierIdChoisi(dossiers.length > 1 ? null : dossierIdChoisi)}
        />
      </View>

      {cycle && (
        <View style={styles.progressionBox}>
          <Text style={styles.progressionTitre}>Progression du cycle</Text>
          <View style={styles.progressionContainer}>
            {Array.from({ length: cycle.targetInstallments }, (_, i) => i + 1).map((n) => (
              <View
                key={n}
                style={[
                  styles.progressionTexteBox,
                  n <= cycle.installmentCount ? styles.progressionFait : styles.progressionAFaire,
                ]}
              >
                <Text style={[styles.progressionTexte, n <= cycle.installmentCount ? styles.progressionTexteFait : styles.progressionTexteAFaire]}>
                  {n}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.progressionTexte}>
            {cycle.installmentCount} / {cycle.targetInstallments} versements
          </Text>
        </View>
      )}

      <View style={styles.saisieMontant}>
        <Text style={styles.label}>Montant du versement (XAF)</Text>
        <Input
          label="Montant"
          value={montant}
          onChangeText={setMontant}
          keyboardType="numeric"
          placeholder="0"
          accessibilityLabel="Montant du versement"
        />
        {cycle && (
          <Text style={styles.montantRef}>
            Montant attendu du cycle : {formatMontantXAF(Number.parseInt(cycle.fixedAmountXaf, 10))}
          </Text>
        )}
      </View>

      <View style={styles.actionZone}>
        <Button
          label={soumissionEnCours ? 'Enregistrement…' : 'Enregistrer le versement'}
          variant="primary"
          onPress={enregistrerCollecte}
          disabled={soumissionEnCours || !cycle}
        />
      </View>

      {recuOperation && (
        <View style={styles.resultat}>
          <Text style={styles.resultatTitre}>Versement enregistré</Text>
          <Text style={styles.resultatDetails}>
            {formatMontantXAF(recuOperation.montant)} versés sur le cycle.
          </Text>
          <Text style={styles.resultatReference}>
            Transaction : {recuOperation.transactionId}
          </Text>
          <Button label="Nouveau versement" variant="secondary" onPress={() => { setRecuOperation(null); setMontant(cycle ? cycle.fixedAmountXaf : ''); }} />
        </View>
      )}

      {erreur && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erreur de versement</Text>
          <Text style={styles.errorMessage}>{erreur}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    gap: 4,
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
  selectionBox: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },
  selectField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  selectValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  selectHint: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 10,
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
  progressionTexteBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressionFait: {
    backgroundColor: colors.success,
  },
  progressionAFaire: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressionTexte: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  progressionTexteFait: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressionTexteAFaire: {
    color: colors.muted,
  },
  saisieMontant: {
    marginBottom: 20,
  },
  montantRef: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  actionZone: {
    marginTop: 20,
  },
  resultat: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    alignItems: 'center',
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
    marginBottom: 12,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
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
