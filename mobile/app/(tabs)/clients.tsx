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
import { UserPlus, Search, FolderPlus, CheckCircle, RefreshCw } from 'lucide-react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { InputTexte } from '../../src/components/InputTexte';
import { SelecteurSimple } from '../../src/components/SelecteurSimple';
import { StatusPill } from '../../src/components/StatusPill';
import { DialogConfirmation } from '../../src/components/DialogConfirmation';
import { AppNotice } from '../../src/components/AppNotice';
import { colors } from '../../src/components/theme';
import {
  ApiError,
  createClient,
  listClients,
  listMarkets,
  updateClientStatus,
  type ClientListItem,
  type MarketRef,
} from '../../src/services/api';
import { authenticationService } from '../../src/features/auth';
import { clientRepository } from '../../src/database/repositories';
import { StatutClient, SyncStatus } from '../../src/database/schema';

export default function ClientsScreen() {
  const router = useRouter();

  // Données de référence
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [marches, setMarches] = useState<MarketRef[]>([]);
  const [chargement, setChargement] = useState(true);
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  const [actionEnCoursId, setActionEnCoursId] = useState<string | null>(null);

  // Formulaire
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [quartier, setQuartier] = useState('');
  const [marcheIdSelectionne, setMarcheIdSelectionne] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');

  // Notifications et dialogues
  const [erreur, setErreur] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [clientCree, setClientCree] = useState<{ code: string; nom: string } | null>(null);

  // Identifiants de session agent
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agenceId, setAgenceId] = useState<string | null>(null);

  const initialiserSessionEtMarches = useCallback(async () => {
    try {
      const session = await authenticationService.getCurrentSession();
      if (session?.user) {
        setAgentId(session.user.id);
        if (session.user.branchId) {
          setAgenceId(session.user.branchId);
        }
      }

      const listeMarches = await listMarkets();
      setMarches(listeMarches);
      if (listeMarches.length > 0 && !marcheIdSelectionne) {
        setMarcheIdSelectionne(listeMarches[0].id);
      }
    } catch (e) {
      // Ignorer l'erreur d'initialisation, les valeurs par défaut s'appliqueront
    }
  }, [marcheIdSelectionne]);

  const chargerClients = useCallback(async (termeRecherche = '') => {
    setChargement(true);
    setErreur(null);
    try {
      const resultat = await listClients({
        search: termeRecherche.trim() || undefined,
        limit: 50,
      });
      setClients(resultat.items);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else {
        setErreur('Impossible de charger les clients depuis le serveur.');
      }
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void initialiserSessionEtMarches();
    void chargerClients();
  }, [initialiserSessionEtMarches, chargerClients]);

  function handleRecherche(texte: string) {
    setRecherche(texte);
    void chargerClients(texte);
  }

  async function handleCreerClient() {
    if (!nom.trim() || !prenom.trim() || !telephone.trim()) {
      setErreur('Veuillez renseigner le nom, le prénom et le téléphone.');
      return;
    }

    setErreur(null);
    setSoumissionEnCours(true);

    // Génération d'un code client unique
    const codeGenere = `CLI-${Date.now().toString().slice(-6)}`;
    const effectiveAgentId = agentId || '00000000-0000-0000-0000-000000000000';
    const effectiveBranchId = agenceId || (marches[0]?.id ? marches[0].id : '00000000-0000-0000-0000-000000000000');

    try {
      const clientServeur = await createClient({
        clientCode: codeGenere,
        firstName: prenom.trim(),
        lastName: nom.trim(),
        phone: telephone.trim(),
        neighborhood: quartier.trim() || undefined,
        branchId: effectiveBranchId,
        marketId: marcheIdSelectionne || undefined,
        collectionAgentId: effectiveAgentId,
      });

      // Miroir SQLite local pour la traçabilité hors-ligne
      try {
        await clientRepository.create({
          nom: clientServeur.lastName,
          prenom: clientServeur.firstName,
          telephone_normalise: clientServeur.phone || telephone.trim(),
          statut: StatutClient.PROVISOIRE,
          agence_id: clientServeur.branchId,
          date_creation_declaree: new Date().toISOString(),
          doublon_potentiel: false,
          cle_idempotence: clientServeur.id,
          sync_status: SyncStatus.SYNCED,
          date_maj: new Date().toISOString(),
        });
      } catch {
        // En cas d'échec SQLite local, la donnée serveur fait foi
      }

      setClientCree({
        code: clientServeur.clientCode,
        nom: `${clientServeur.firstName} ${clientServeur.lastName}`,
      });
      setDialogVisible(true);

      // Réinitialisation du formulaire
      setNom('');
      setPrenom('');
      setTelephone('');
      setQuartier('');

      // Rafraîchir la liste
      await chargerClients();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else if (err instanceof Error) {
        setErreur(err.message);
      } else {
        setErreur('Erreur lors de la création du client sur le serveur.');
      }
    } finally {
      setSoumissionEnCours(false);
    }
  }

  async function handleActiverClient(id: string) {
    setActionEnCoursId(id);
    setErreur(null);
    try {
      await updateClientStatus(id, 'ACTIVE');
      await chargerClients(recherche);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErreur(err.message);
      } else {
        setErreur('Impossible de confirmer le statut du client.');
      }
    } finally {
      setActionEnCoursId(null);
    }
  }

  function handleOuvrirDossier(c: ClientListItem) {
    router.push({
      pathname: '/(tabs)/dossiers',
      params: {
        clientId: c.id,
        clientName: c.fullName,
        marketId: c.marketId || '',
      },
    });
  }

  const statutPill = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { kind: 'online' as const, label: 'ACTIF' };
      case 'PROVISIONAL':
        return { kind: 'pending' as const, label: 'PROVISOIRE' };
      case 'REJECTED':
        return { kind: 'error' as const, label: 'REJETÉ' };
      default:
        return { kind: 'unknown' as const, label: status };
    }
  };

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
            Gestion des clients
          </Text>
          <Text style={styles.subtitle}>
            Enregistrez les clients et ouvrez leurs dossiers de tontine.
          </Text>
        </View>

        {erreur ? (
          <AppNotice title="Erreur" body={erreur} kind="error" />
        ) : null}

        {/* Formulaire de création */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <UserPlus size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Nouveau client</Text>
          </View>

          <InputTexte
            label="Nom de famille"
            value={nom}
            onChangeText={setNom}
            placeholder="Ex. Kouamé"
            required
            disabled={soumissionEnCours}
          />

          <InputTexte
            label="Prénom(s)"
            value={prenom}
            onChangeText={setPrenom}
            placeholder="Ex. Jean"
            required
            disabled={soumissionEnCours}
          />

          <InputTexte
            label="Numéro de téléphone"
            value={telephone}
            onChangeText={setTelephone}
            placeholder="Ex. +225 07 12 34 56"
            keyboardType="phone-pad"
            required
            disabled={soumissionEnCours}
          />

          <InputTexte
            label="Quartier / Adresse"
            value={quartier}
            onChangeText={setQuartier}
            placeholder="Ex. Treichville, Rue 12"
            disabled={soumissionEnCours}
          />

          {optionsMarches.length > 0 ? (
            <SelecteurSimple
              label="Marché de rattachement"
              value={marcheIdSelectionne}
              options={optionsMarches}
              onValueChange={(val) => setMarcheIdSelectionne(val)}
              accessibilityLabel="Marché du client"
            />
          ) : null}

          <Pressable
            style={[
              styles.boutonCreer,
              (!nom || !prenom || !telephone || soumissionEnCours) && styles.boutonDesactive,
            ]}
            onPress={handleCreerClient}
            disabled={!nom || !prenom || !telephone || soumissionEnCours}
          >
            {soumissionEnCours ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <Text style={styles.texteBoutonCreer}>
                Créer le client (Statut : PROVISOIRE)
              </Text>
            )}
          </Pressable>
        </View>

        {/* Section de recherche et liste */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              Portefeuille clients ({clients.length})
            </Text>
            <Pressable
              onPress={() => void chargerClients(recherche)}
              style={styles.boutonActualiser}
            >
              <RefreshCw size={16} color={colors.primary} />
            </Pressable>
          </View>

          <InputTexte
            label="Rechercher un client"
            value={recherche}
            onChangeText={handleRecherche}
            placeholder="Rechercher par nom, prénom ou code…"
          />

          {chargement ? (
            <View style={styles.chargement}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.texteChargement}>Chargement des clients…</Text>
            </View>
          ) : clients.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.texteVide}>
                Aucun client trouvé. Créez-en un à l'aide du formulaire ci-dessus.
              </Text>
            </View>
          ) : (
            clients.map((c) => {
              const pill = statutPill(c.status);
              const estEnCours = actionEnCoursId === c.id;

              return (
                <View key={c.id} style={styles.carteClient}>
                  <View style={styles.enteteCarteClient}>
                    <View style={styles.infosClient}>
                      <Text style={styles.nomClient}>{c.fullName}</Text>
                      <Text style={styles.codeClient}>{c.clientCode}</Text>
                    </View>
                    <StatusPill kind={pill.kind} label={pill.label} />
                  </View>

                  <View style={styles.detailsClient}>
                    {c.marketName ? (
                      <Text style={styles.texteDetail}>
                        Marché : <Text style={styles.valeurDetail}>{c.marketName}</Text>
                      </Text>
                    ) : null}
                    {c.branchName ? (
                      <Text style={styles.texteDetail}>
                        Agence : <Text style={styles.valeurDetail}>{c.branchName}</Text>
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.actionsClientRow}>
                    {c.status === 'PROVISIONAL' ? (
                      <Pressable
                        style={[styles.boutonActionSecondaire, estEnCours && styles.boutonDesactive]}
                        onPress={() => void handleActiverClient(c.id)}
                        disabled={estEnCours}
                      >
                        {estEnCours ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <CheckCircle size={14} color={colors.primary} />
                            <Text style={styles.texteActionSecondaire}>Confirmer</Text>
                          </>
                        )}
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={styles.boutonActionPrincipal}
                      onPress={() => handleOuvrirDossier(c)}
                    >
                      <FolderPlus size={14} color={colors.surface} />
                      <Text style={styles.texteActionPrincipal}>Ouvrir un dossier</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <DialogConfirmation
        visible={dialogVisible}
        title="Client enregistré"
        message={
          clientCree
            ? `Le client ${clientCree.nom} a été créé avec succès sur le serveur avec le code ${clientCree.code} (statut : PROVISOIRE).`
            : ''
        }
        confirmLabel="OK"
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
    marginBottom: 16,
    gap: 8,
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
  section: {
    marginTop: 12,
    gap: 12,
  },
  sectionTitleRow: {
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
  },
  texteVide: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  carteClient: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  enteteCarteClient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infosClient: {
    flex: 1,
    gap: 2,
  },
  nomClient: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  codeClient: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsClient: {
    gap: 2,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  texteDetail: {
    color: colors.muted,
    fontSize: 12,
  },
  valeurDetail: {
    color: colors.text,
    fontWeight: '600',
  },
  actionsClientRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  boutonActionSecondaire: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  texteActionSecondaire: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  boutonActionPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  texteActionPrincipal: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});
