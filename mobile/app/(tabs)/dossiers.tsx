import { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  FolderPlus,
  FolderOpen,
  Receipt,
  Wallet,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { InputTexte } from '../../src/components/InputTexte';
import { InputMontantXAF } from '../../src/components/InputMontantXAF';
import { SelecteurSimple } from '../../src/components/SelecteurSimple';
import { StatusPill } from '../../src/components/StatusPill';
import { DialogConfirmation } from '../../src/components/DialogConfirmation';
import { AppNotice } from '../../src/components/AppNotice';
import { colors } from '../../src/components/theme';
import { formatMontantXAF } from '../../src/utils/montants';
import {
  ApiError,
  createDossier,
  createCycle,
  depositToCycle,
  getDossier,
  getCycle,
  listClients,
  listDossiers,
  listMarkets,
  type ClientListItem,
  type CycleSummary,
  type DossierDetail,
  type DossierListItem,
  type MarketRef,
} from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';

export default function DossiersScreen() {
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string; marketId?: string }>();

  // État de vue : 'liste' | 'nouveau' | 'detail'
  const [vueCourante, setVueCourante] = useState<'liste' | 'nouveau' | 'detail'>('liste');

  // Données globales
  const [dossiers, setDossiers] = useState<DossierListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [marches, setMarches] = useState<MarketRef[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire nouveau dossier
  const [clientIdChoisi, setClientIdChoisi] = useState<string | null>(null);
  const [marcheIdChoisi, setMarcheIdChoisi] = useState<string | null>(null);
  const [montantFixe, setMontantFixe] = useState('1000');
  const [soumissionDossier, setSoumissionDossier] = useState(false);

  // Fiche dossier sélectionné et son cycle actif
  const [dossierSelectionne, setDossierSelectionne] = useState<DossierDetail | null>(null);
  const [cycleActif, setCycleActif] = useState<CycleSummary | null>(null);
  const [chargementDetail, setChargementDetail] = useState(false);

  // Formulaire de collecte (versement)
  const [montantCollecte, setMontantCollecte] = useState('');
  const [soumissionCollecte, setSoumissionCollecte] = useState(false);
  const [dialogCollecteVisible, setDialogCollecteVisible] = useState(false);
  const [recuCollecte, setRecuCollecte] = useState<{ transactionId: string; montant: number; numero: number } | null>(null);

  // Session
  const [agentId, setAgentId] = useState<string | null>(null);

  const initialiserDonnees = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const session = await authenticationService.getCurrentSession();
      if (session?.user) {
        setAgentId(session.user.id);
      }

      const [listeD, listeC, listeM] = await Promise.all([
        listDossiers({ limit: 50 }),
        listClients({ limit: 100 }),
        listMarkets(),
      ]);

      setDossiers(listeD.items);
      setClients(listeC.items);
      setMarches(listeM);

      // Si des paramètres client ont été transmis depuis l'écran Clients
      if (params.clientId) {
        setClientIdChoisi(params.clientId);
        if (params.marketId) {
          setMarcheIdChoisi(params.marketId);
        } else if (listeM.length > 0) {
          setMarcheIdChoisi(listeM[0].id);
        }
        setVueCourante('nouveau');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else {
        setErreur('Impossible de charger les dossiers.');
      }
    } finally {
      setChargement(false);
    }
  }, [params.clientId, params.marketId]);

  useEffect(() => {
    void initialiserDonnees();
  }, [initialiserDonnees]);

  async function chargerDetailDossier(dossierId: string) {
    setChargementDetail(true);
    setErreur(null);
    try {
      const dossier = await getDossier(dossierId);
      setDossierSelectionne(dossier);

      // S'il possède un cycle, charger les détails du cycle
      if (dossier.cycles && dossier.cycles.length > 0) {
        const premierCycle = dossier.cycles[0];
        const cycleComplet = await getCycle(premierCycle.id);
        setCycleActif(cycleComplet);
        setMontantCollecte(cycleComplet.fixedAmountXaf);
      } else {
        setCycleActif(null);
        setMontantCollecte('');
      }

      setVueCourante('detail');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else {
        setErreur('Impossible de charger les détails du dossier.');
      }
    } finally {
      setChargementDetail(false);
    }
  }

  async function handleCreerDossierEtCycle() {
    if (!clientIdChoisi) {
      setErreur('Veuillez sélectionner un client.');
      return;
    }

    const clientObj = clients.find((c) => c.id === clientIdChoisi);
    const marcheId = marcheIdChoisi || clientObj?.marketId || (marches[0]?.id ?? '');

    if (!marcheId) {
      setErreur('Un marché valide est requis pour ouvrir le dossier.');
      return;
    }

    const montantInt = parseInt(montantFixe.replace(/\s/g, ''), 10);
    if (isNaN(montantInt) || montantInt <= 0) {
      setErreur('Le montant fixe par versement doit être un entier supérieur à 0.');
      return;
    }

    setSoumissionDossier(true);
    setErreur(null);

    try {
      const nouveauDossier = await createDossier({
        clientId: clientIdChoisi,
        agentId: agentId || '00000000-0000-0000-0000-000000000000',
        marketId: marcheId,
        dailyAmountXaf: String(montantInt),
        deviceId: 'mobile-agent-app',
      });

      // Ouvrir immédiatement le cycle à 31 versements sur ce dossier
      try {
        await createCycle(nouveauDossier.id, montantInt);
      } catch (errCycle: unknown) {
        // Le cycle a peut-être échoué si le client est inactif
        if (errCycle instanceof ApiError) {
          setErreur(`Dossier créé mais cycle non ouvert : ${errCycle.message}`);
        }
      }

      // Recharger et afficher le dossier
      await initialiserDonnees();
      await chargerDetailDossier(nouveauDossier.id);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Erreur lors de la création du dossier.');
      }
    } finally {
      setSoumissionDossier(false);
    }
  }

  async function handleEnregistrerCollecte() {
    if (!cycleActif) {
      setErreur('Aucun cycle actif pour enregistrer un versement.');
      return;
    }

    const montantInt = parseInt(montantCollecte.replace(/\s/g, ''), 10);
    const montantAttendu = parseInt(cycleActif.fixedAmountXaf, 10);

    if (montantInt !== montantAttendu) {
      setErreur(`Le montant du versement doit être exactement de ${formatMontantXAF(montantAttendu)}.`);
      return;
    }

    setSoumissionCollecte(true);
    setErreur(null);

    try {
      const resultat = await depositToCycle(cycleActif.id, montantInt);
      const prochainNumero = cycleActif.installmentCount + 1;

      setRecuCollecte({
        transactionId: resultat.transactionId,
        montant: montantInt,
        numero: prochainNumero,
      });
      setDialogCollecteVisible(true);

      // Rafraîchir les informations du cycle et du dossier
      const cycleMaj = await getCycle(cycleActif.id);
      setCycleActif(cycleMaj);

      if (dossierSelectionne) {
        const dossierMaj = await getDossier(dossierSelectionne.id);
        setDossierSelectionne(dossierMaj);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Erreur lors de l’enregistrement de la collecte.');
      }
    } finally {
      setSoumissionCollecte(false);
    }
  }

  const optionsClients = clients.map((c) => ({
    label: `${c.fullName} (${c.clientCode}) — ${c.status === 'ACTIVE' ? 'ACTIF' : 'PROVISOIRE'}`,
    value: c.id,
  }));

  const optionsMarches = marches.map((m) => ({
    label: `${m.code} — ${m.name}`,
    value: m.id,
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
            Dossiers & Collectes
          </Text>
          <Text style={styles.subtitle}>
            Cycles d'épargne à 31 versements et enregistrement des collectes.
          </Text>
        </View>

        {/* Barre de navigation d'onglets */}
        <View style={styles.ongletsBarre}>
          <Pressable
            style={[styles.ongletBouton, vueCourante === 'liste' && styles.ongletActif]}
            onPress={() => setVueCourante('liste')}
          >
            <FolderOpen size={16} color={vueCourante === 'liste' ? colors.primary : colors.muted} />
            <Text style={[styles.ongletTexte, vueCourante === 'liste' && styles.ongletTexteActif]}>
              Dossiers ({dossiers.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.ongletBouton, vueCourante === 'nouveau' && styles.ongletActif]}
            onPress={() => setVueCourante('nouveau')}
          >
            <FolderPlus size={16} color={vueCourante === 'nouveau' ? colors.primary : colors.muted} />
            <Text style={[styles.ongletTexte, vueCourante === 'nouveau' && styles.ongletTexteActif]}>
              Ouvrir un dossier
            </Text>
          </Pressable>

          {dossierSelectionne ? (
            <Pressable
              style={[styles.ongletBouton, vueCourante === 'detail' && styles.ongletActif]}
              onPress={() => setVueCourante('detail')}
            >
              <Wallet size={16} color={vueCourante === 'detail' ? colors.primary : colors.muted} />
              <Text style={[styles.ongletTexte, vueCourante === 'detail' && styles.ongletTexteActif]}>
                Fiche & Collecte
              </Text>
            </Pressable>
          ) : null}
        </View>

        {erreur ? (
          <AppNotice title="Information" body={erreur} kind="error" />
        ) : null}

        {/* VUE 1 : LISTE DES DOSSIERS */}
        {vueCourante === 'liste' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dossiers de tontine</Text>
              <Pressable
                onPress={() => void initialiserDonnees()}
                style={styles.boutonActualiser}
              >
                <RefreshCw size={16} color={colors.primary} />
              </Pressable>
            </View>

            {chargement ? (
              <View style={styles.chargement}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.texteChargement}>Chargement des dossiers…</Text>
              </View>
            ) : dossiers.length === 0 ? (
              <View style={styles.vide}>
                <Text style={styles.texteVide}>
                  Aucun dossier ouvert pour le moment.
                </Text>
                <Pressable
                  style={styles.boutonActionSimple}
                  onPress={() => setVueCourante('nouveau')}
                >
                  <Text style={styles.texteBoutonActionSimple}>
                    Ouvrir un premier dossier
                  </Text>
                </Pressable>
              </View>
            ) : (
              dossiers.map((d) => (
                <Pressable
                  key={d.id}
                  style={styles.carteDossier}
                  onPress={() => void chargerDetailDossier(d.id)}
                >
                  <View style={styles.enteteCarteDossier}>
                    <View style={styles.infosDossier}>
                      <Text style={styles.numeroDossier}>{d.dossierNo}</Text>
                      <Text style={styles.nomClientDossier}>
                        {d.client ? `${d.client.firstName} ${d.client.lastName}` : 'Client'}
                      </Text>
                    </View>
                    <StatusPill
                      kind={d.status === 'OPEN' ? 'online' : 'offline'}
                      label={d.status === 'OPEN' ? 'OUVERT' : 'CLÔTURÉ'}
                    />
                  </View>

                  <View style={styles.ligneDetailDossier}>
                    <Text style={styles.labelDetail}>Versement prévu :</Text>
                    <Text style={styles.valeurDetailGras}>
                      {formatMontantXAF(parseInt(d.dailyAmountXaf, 10))}
                    </Text>
                  </View>

                  <View style={styles.piedCarteDossier}>
                    <Text style={styles.texteDate}>
                      Créé le {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                    <View style={styles.lienVoir}>
                      <Text style={styles.texteLienVoir}>Consulter / Collecter</Text>
                      <ArrowRight size={14} color={colors.primary} />
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* VUE 2 : NOUVEAU DOSSIER */}
        {vueCourante === 'nouveau' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FolderPlus size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Ouvrir un dossier de tontine</Text>
            </View>

            <AppNotice
              title="Règles du cycle à 31 versements"
              body="Un dossier porte des cycles successifs de 31 versements fixes. Le montant choisi à l'ouverture reste fixe tout au long du cycle."
              kind="info"
            />

            {optionsClients.length > 0 ? (
              <SelecteurSimple
                label="Client bénéficiaire"
                value={clientIdChoisi}
                options={optionsClients}
                onValueChange={(val) => setClientIdChoisi(val)}
                accessibilityLabel="Client du dossier"
              />
            ) : (
              <Text style={styles.texteAttention}>
                Aucun client disponible. Veuillez d'abord créer un client.
              </Text>
            )}

            {optionsMarches.length > 0 ? (
              <SelecteurSimple
                label="Marché de rattachement"
                value={marcheIdChoisi}
                options={optionsMarches}
                onValueChange={(val) => setMarcheIdChoisi(val)}
                accessibilityLabel="Marché du dossier"
              />
            ) : null}

            <InputTexte
              label="Montant fixe du versement (FCFA)"
              value={montantFixe}
              onChangeText={setMontantFixe}
              placeholder="Ex. 1000, 2000, 5000"
              keyboardType="numeric"
              required
              disabled={soumissionDossier}
            />

            <View style={styles.recapitulatifBox}>
              <Text style={styles.recapTitre}>Récapitulatif du cycle</Text>
              <Text style={styles.recapLigne}>
                Nombre de versements cible : <Text style={styles.recapValeur}>31 versements</Text>
              </Text>
              <Text style={styles.recapLigne}>
                Total cible de collecte :{' '}
                <Text style={styles.recapValeur}>
                  {formatMontantXAF(parseInt(montantFixe || '0', 10) * 31)}
                </Text>
              </Text>
              <Text style={styles.recapLigne}>
                Commission retenue au 1er retrait :{' '}
                <Text style={styles.recapValeur}>
                  {formatMontantXAF(parseInt(montantFixe || '0', 10))} (1 versement)
                </Text>
              </Text>
            </View>

            <Pressable
              style={[
                styles.boutonCreer,
                (!clientIdChoisi || !montantFixe || soumissionDossier) && styles.boutonDesactive,
              ]}
              onPress={handleCreerDossierEtCycle}
              disabled={!clientIdChoisi || !montantFixe || soumissionDossier}
            >
              {soumissionDossier ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.texteBoutonCreer}>
                  Ouvrir le dossier et démarrer le cycle
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* VUE 3 : FICHE DU DOSSIER ET ENREGISTREMENT DE COLLECTE */}
        {vueCourante === 'detail' && dossierSelectionne && (
          <View style={styles.section}>
            {chargementDetail ? (
              <View style={styles.chargement}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.texteChargement}>Chargement des données du cycle…</Text>
              </View>
            ) : (
              <>
                {/* Carte récapitulative du dossier */}
                <View style={styles.carteFicheDossier}>
                  <View style={styles.enteteFiche}>
                    <View>
                      <Text style={styles.ficheNumero}>{dossierSelectionne.dossierNo}</Text>
                      <Text style={styles.ficheClient}>
                        {dossierSelectionne.client
                          ? `${dossierSelectionne.client.firstName} ${dossierSelectionne.client.lastName}`
                          : 'Client'}
                      </Text>
                    </View>
                    <StatusPill
                      kind={dossierSelectionne.status === 'OPEN' ? 'online' : 'offline'}
                      label={dossierSelectionne.status === 'OPEN' ? 'OUVERT' : 'CLÔTURÉ'}
                    />
                  </View>

                  {cycleActif ? (
                    <View style={styles.blocCycle}>
                      <View style={styles.enteteCycle}>
                        <Text style={styles.cycleTitre}>Cycle à 31 versements</Text>
                        <StatusPill
                          kind={cycleActif.status === 'ACTIVE' ? 'online' : 'pending'}
                          label={cycleActif.status === 'ACTIVE' ? 'ACTIF' : cycleActif.status}
                        />
                      </View>

                      {/* Progression visuelle */}
                      <View style={styles.progressionContainer}>
                        <View style={styles.progressionLabels}>
                          <Text style={styles.progressionTexte}>
                            Progression : {cycleActif.installmentCount} / 31 versements
                          </Text>
                          <Text style={styles.progressionPourcentage}>
                            {Math.round((cycleActif.installmentCount / 31) * 100)} %
                          </Text>
                        </View>
                        <View style={styles.barreFond}>
                          <View
                            style={[
                              styles.barreRemplie,
                              { width: `${Math.min(100, (cycleActif.installmentCount / 31) * 100)}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Métriques financières */}
                      <View style={styles.grilleMetriques}>
                        <View style={styles.metriqueCase}>
                          <Text style={styles.metriqueLabel}>Montant fixe</Text>
                          <Text style={styles.metriqueValeur}>
                            {formatMontantXAF(parseInt(cycleActif.fixedAmountXaf, 10))}
                          </Text>
                        </View>
                        <View style={styles.metriqueCase}>
                          <Text style={styles.metriqueLabel}>Cumul collecté</Text>
                          <Text style={styles.metriqueValeur}>
                            {formatMontantXAF(parseInt(cycleActif.totalCollectedXaf, 10))}
                          </Text>
                        </View>
                        <View style={styles.metriqueCase}>
                          <Text style={styles.metriqueLabel}>Solde disponible</Text>
                          <Text style={styles.metriqueValeurPositive}>
                            {formatMontantXAF(parseInt(cycleActif.availableBalanceXaf, 10))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <AppNotice
                      title="Aucun cycle ouvert"
                      body="Ce dossier ne possède actuellement aucun cycle actif."
                      kind="warning"
                    />
                  )}
                </View>

                {/* FORMULAIRE D'ENREGISTREMENT DE COLLECTE */}
                {cycleActif && cycleActif.status === 'ACTIVE' && cycleActif.installmentCount < 31 ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Receipt size={20} color={colors.primary} />
                      <Text style={styles.cardTitle}>Enregistrer une collecte</Text>
                    </View>

                    <Text style={styles.infoVersementFixe}>
                      Versement #{cycleActif.installmentCount + 1} sur 31 : montant fixe obligatoire de{' '}
                      <Text style={styles.texteGras}>
                        {formatMontantXAF(parseInt(cycleActif.fixedAmountXaf, 10))}
                      </Text>
                    </Text>

                    <InputTexte
                      label="Montant reçu (FCFA)"
                      value={montantCollecte}
                      onChangeText={setMontantCollecte}
                      placeholder={cycleActif.fixedAmountXaf}
                      keyboardType="numeric"
                      required
                      disabled={soumissionCollecte}
                    />

                    <Pressable
                      style={[
                        styles.boutonCollecter,
                        (!montantCollecte || soumissionCollecte) && styles.boutonDesactive,
                      ]}
                      onPress={handleEnregistrerCollecte}
                      disabled={!montantCollecte || soumissionCollecte}
                    >
                      {soumissionCollecte ? (
                        <ActivityIndicator color={colors.surface} size="small" />
                      ) : (
                        <Text style={styles.texteBoutonCollecter}>
                          Valider le versement de {formatMontantXAF(parseInt(montantCollecte || '0', 10))}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ) : cycleActif && cycleActif.installmentCount >= 31 ? (
                  <AppNotice
                    title="Cycle complet (31/31)"
                    body="Les 31 versements de ce cycle ont été atteints. Le client peut désormais solliciter un retrait."
                    kind="success"
                  />
                ) : null}

                {/* HISTORIQUE DES TRANSACTIONS DU CYCLE */}
                <View style={styles.sectionHistorique}>
                  <Text style={styles.sectionTitle}>
                    Historique des versements ({cycleActif?.transactions?.length ?? 0})
                  </Text>

                  {(!cycleActif?.transactions || cycleActif.transactions.length === 0) ? (
                    <View style={styles.vide}>
                      <Text style={styles.texteVide}>
                        Aucun versement enregistré pour le moment sur ce cycle.
                      </Text>
                    </View>
                  ) : (
                    cycleActif.transactions.map((tx, idx) => (
                      <View key={tx.id || idx} style={styles.ligneTransaction}>
                        <View style={styles.txIcone}>
                          <CheckCircle size={18} color={colors.success} />
                        </View>
                        <View style={styles.txInfos}>
                          <Text style={styles.txType}>
                            {tx.type === 'DEPOSIT' ? `Versement #${idx + 1}` : tx.type}
                          </Text>
                          <Text style={styles.txDate}>
                            {tx.occurredAt
                              ? new Date(tx.occurredAt).toLocaleString('fr-FR')
                              : 'Enregistré'}
                          </Text>
                        </View>
                        <Text style={styles.txMontant}>
                          +{formatMontantXAF(parseInt(tx.amountXaf, 10))}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Boîte de dialogue de reçu de collecte */}
      <DialogConfirmation
        visible={dialogCollecteVisible}
        title="Collecte enregistrée"
        message={
          recuCollecte
            ? `Versement #${recuCollecte.numero} de ${formatMontantXAF(recuCollecte.montant)} validé avec succès par le serveur.\n\nRéférence d'opération :\n${recuCollecte.transactionId}`
            : ''
        }
        confirmLabel="Terminer"
        cancelLabel=""
        onConfirm={() => setDialogCollecteVisible(false)}
        onCancel={() => setDialogCollecteVisible(false)}
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
  ongletsBarre: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  ongletBouton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ongletActif: {
    backgroundColor: colors.primarySoft,
  },
  ongletTexte: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  ongletTexteActif: {
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  boutonActualiser: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  carteDossier: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  enteteCarteDossier: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infosDossier: {
    flex: 1,
    gap: 2,
  },
  numeroDossier: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  nomClientDossier: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  ligneDetailDossier: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  labelDetail: {
    color: colors.muted,
    fontSize: 13,
  },
  valeurDetailGras: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  piedCarteDossier: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  texteDate: {
    color: colors.muted,
    fontSize: 11,
  },
  lienVoir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  texteLienVoir: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  recapitulatifBox: {
    backgroundColor: colors.actionSoft,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  recapTitre: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  recapLigne: {
    color: colors.text,
    fontSize: 12,
  },
  recapValeur: {
    fontWeight: '700',
  },
  boutonCreer: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  boutonDesactive: {
    opacity: 0.5,
  },
  texteBoutonCreer: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  texteAttention: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  carteFicheDossier: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  enteteFiche: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  ficheNumero: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  ficheClient: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  blocCycle: {
    gap: 12,
  },
  enteteCycle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cycleTitre: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  progressionContainer: {
    gap: 6,
  },
  progressionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressionTexte: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  progressionPourcentage: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  barreFond: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barreRemplie: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 5,
  },
  grilleMetriques: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metriqueCase: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  metriqueLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  metriqueValeur: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  metriqueValeurPositive: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '800',
  },
  infoVersementFixe: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  texteGras: {
    fontWeight: '700',
    color: colors.primary,
  },
  boutonCollecter: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  texteBoutonCollecter: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHistorique: {
    marginTop: 8,
    gap: 8,
  },
  ligneTransaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  txIcone: {
    padding: 4,
  },
  txInfos: {
    flex: 1,
    gap: 2,
  },
  txType: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    color: colors.muted,
    fontSize: 11,
  },
  txMontant: {
    color: colors.success,
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
  vide: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    gap: 12,
  },
  texteVide: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  boutonActionSimple: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  texteBoutonActionSimple: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
