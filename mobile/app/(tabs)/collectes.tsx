import { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Receipt, CheckCircle, ArrowRight, FolderPlus } from 'lucide-react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { InputTexte } from '../../src/components/InputTexte';
import { SelecteurSimple } from '../../src/components/SelecteurSimple';
import { StatusPill } from '../../src/components/StatusPill';
import { DialogConfirmation } from '../../src/components/DialogConfirmation';
import { AppNotice } from '../../src/components/AppNotice';
import { colors } from '../../src/components/theme';
import { formatMontantXAF } from '../../src/utils/montants';
import {
  ApiError,
  depositToCycle,
  getCycle,
  listDossiers,
  type CycleSummary,
  type DossierListItem,
} from '../../src/services/api';

export default function CollectesScreen() {
  const router = useRouter();

  const [dossiers, setDossiers] = useState<DossierListItem[]>([]);
  const [dossierIdChoisi, setDossierIdChoisi] = useState<string | null>(null);
  const [cycleActif, setCycleActif] = useState<CycleSummary | null>(null);
  const [montant, setMontant] = useState('');
  const [chargement, setChargement] = useState(true);
  const [chargementCycle, setChargementCycle] = useState(false);
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [recuOperation, setRecuOperation] = useState<{
    transactionId: string;
    montant: number;
    numero: number;
  } | null>(null);

  const chargerDossiers = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await listDossiers({ status: 'OPEN', limit: 50 });
      setDossiers(res.items);
      if (res.items.length > 0 && !dossierIdChoisi) {
        setDossierIdChoisi(res.items[0].id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else {
        setErreur('Impossible de charger les dossiers ouverts.');
      }
    } finally {
      setChargement(false);
    }
  }, [dossierIdChoisi]);

  useEffect(() => {
    void chargerDossiers();
  }, [chargerDossiers]);

  useEffect(() => {
    if (!dossierIdChoisi) {
      setCycleActif(null);
      setMontant('');
      return;
    }

    let estMonte = true;
    async function chargerCycleDossier() {
      setChargementCycle(true);
      setErreur(null);
      try {
        const { getDossier } = await import('../../src/services/api');
        const d = await getDossier(dossierIdChoisi!);
        if (estMonte) {
          if (d.cycles && d.cycles.length > 0) {
            const premierCycle = d.cycles[0];
            const cycle = await getCycle(premierCycle.id);
            if (estMonte) {
              setCycleActif(cycle);
              setMontant(cycle.fixedAmountXaf);
            }
          } else {
            setCycleActif(null);
            setMontant('');
          }
        }
      } catch (err: unknown) {
        if (estMonte) {
          setCycleActif(null);
          setMontant('');
        }
      } finally {
        if (estMonte) setChargementCycle(false);
      }
    }

    void chargerCycleDossier();
    return () => {
      estMonte = false;
    };
  }, [dossierIdChoisi]);

  async function handleEnregistrerVersement() {
    if (!cycleActif) {
      setErreur('Aucun cycle actif associé à ce dossier.');
      return;
    }

    const montantInt = parseInt(montant.replace(/\s/g, ''), 10);
    const montantAttendu = parseInt(cycleActif.fixedAmountXaf, 10);

    if (montantInt !== montantAttendu) {
      setErreur(`Le montant doit correspondre exactement au montant fixe du cycle (${formatMontantXAF(montantAttendu)}).`);
      return;
    }

    setSoumissionEnCours(true);
    setErreur(null);

    try {
      const res = await depositToCycle(cycleActif.id, montantInt);
      const prochainNumero = cycleActif.installmentCount + 1;

      setRecuOperation({
        transactionId: res.transactionId,
        montant: montantInt,
        numero: prochainNumero,
      });
      setDialogVisible(true);

      // Recharger le cycle
      const cycleMaj = await getCycle(cycleActif.id);
      setCycleActif(cycleMaj);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Erreur lors de l’enregistrement de la collecte.');
      }
    } finally {
      setSoumissionEnCours(false);
    }
  }

  const optionsDossiers = dossiers.map((d) => ({
    label: `${d.dossierNo} — ${d.client ? `${d.client.firstName} ${d.client.lastName}` : 'Client'} (${formatMontantXAF(parseInt(d.dailyAmountXaf, 10))})`,
    value: d.id,
  }));

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>COOPECA · ESPACE AGENT</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Enregistrement Collecte
          </Text>
          <Text style={styles.subtitle}>
            Saisie des versements de cycle avec validation serveur et reçu traçable.
          </Text>
        </View>

        {erreur ? (
          <AppNotice title="Erreur" body={erreur} kind="error" />
        ) : null}

        {chargement ? (
          <View style={styles.chargement}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.texteChargement}>Chargement des dossiers ouverts…</Text>
          </View>
        ) : dossiers.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.texteVide}>
              Aucun dossier de tontine ouvert n'est disponible pour collecter.
            </Text>
            <Pressable
              style={styles.boutonNouveau}
              onPress={() => router.push('/(tabs)/dossiers')}
            >
              <FolderPlus size={16} color={colors.surface} />
              <Text style={styles.texteBoutonNouveau}>Ouvrir un dossier</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Receipt size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Nouvelle collecte</Text>
            </View>

            <SelecteurSimple
              label="Sélectionner le dossier client"
              value={dossierIdChoisi}
              options={optionsDossiers}
              onValueChange={(val) => setDossierIdChoisi(val)}
              accessibilityLabel="Dossier à collecter"
            />

            {chargementCycle ? (
              <View style={styles.chargement}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.texteChargement}>Lecture du cycle…</Text>
              </View>
            ) : cycleActif ? (
              <>
                <View style={styles.recapitulatifBox}>
                  <View style={styles.ligneRecap}>
                    <Text style={styles.recapLabel}>Compteur :</Text>
                    <Text style={styles.recapValeur}>
                      {cycleActif.installmentCount} / 31 versements
                    </Text>
                  </View>
                  <View style={styles.ligneRecap}>
                    <Text style={styles.recapLabel}>Cumul encaissé :</Text>
                    <Text style={styles.recapValeur}>
                      {formatMontantXAF(parseInt(cycleActif.totalCollectedXaf, 10))}
                    </Text>
                  </View>
                  <View style={styles.ligneRecap}>
                    <Text style={styles.recapLabel}>Solde net disponible :</Text>
                    <Text style={styles.recapValeurPositive}>
                      {formatMontantXAF(parseInt(cycleActif.availableBalanceXaf, 10))}
                    </Text>
                  </View>
                </View>

                {cycleActif.status === 'ACTIVE' && cycleActif.installmentCount < 31 ? (
                  <>
                    <InputTexte
                      label="Montant reçu (FCFA)"
                      value={montant}
                      onChangeText={setMontant}
                      placeholder={cycleActif.fixedAmountXaf}
                      keyboardType="numeric"
                      required
                      disabled={soumissionEnCours}
                    />

                    <Pressable
                      style={[
                        styles.boutonValider,
                        (!montant || soumissionEnCours) && styles.boutonDesactive,
                      ]}
                      onPress={handleEnregistrerVersement}
                      disabled={!montant || soumissionEnCours}
                    >
                      {soumissionEnCours ? (
                        <ActivityIndicator color={colors.surface} size="small" />
                      ) : (
                        <Text style={styles.texteBoutonValider}>
                          Enregistrer versement #{cycleActif.installmentCount + 1}
                        </Text>
                      )}
                    </Pressable>
                  </>
                ) : (
                  <AppNotice
                    title="Cycle terminé"
                    body="Ce cycle a atteint ses 31 versements réglementaires. Aucun versement supplémentaire n'est autorisé."
                    kind="info"
                  />
                )}
              </>
            ) : (
              <AppNotice
                title="Pas de cycle actif"
                body="Ce dossier ne possède aucun cycle de tontine actif."
                kind="warning"
              />
            )}
          </View>
        )}
      </ScrollView>

      <DialogConfirmation
        visible={dialogVisible}
        title="Collecte confirmée"
        message={
          recuOperation
            ? `Versement #${recuOperation.numero} de ${formatMontantXAF(recuOperation.montant)} validé par le serveur COOPECA.\n\nRéférence de transaction :\n${recuOperation.transactionId}`
            : ''
        }
        confirmLabel="Terminer"
        cancelLabel=""
        onConfirm={() => setDialogVisible(false)}
        onCancel={() => setDialogVisible(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    gap: 6,
    marginBottom: 16,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  recapitulatifBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  ligneRecap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recapLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  recapValeur: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  recapValeurPositive: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  boutonValider: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  boutonDesactive: {
    opacity: 0.5,
  },
  texteBoutonValider: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  chargement: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  texteChargement: {
    color: colors.muted,
    fontSize: 14,
  },
  texteVide: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  boutonNouveau: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  texteBoutonNouveau: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
