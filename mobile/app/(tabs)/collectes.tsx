import { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { InputTexte } from '../../src/components/InputTexte';
import { InputMontantXAF } from '../../src/components/InputMontantXAF';
import { SelecteurDossier } from '../../src/components/SelecteurDossier';
import { StatusPill } from '../../src/components/StatusPill';
import { DialogConfirmation } from '../../src/components/DialogConfirmation';
import { AppNotice } from '../../src/components/AppNotice';
import { colors } from '../../src/components/theme';
import { formatMontantXAF } from '../../src/utils/montants';
import {
  collecteRepository,
  dossierRepository,
} from '../../src/database/repositories';
import {
  BusinessStatusCollecte,
  PrintStatus,
  SyncStatus,
} from '../../src/database/schema';

/**
 * Écran Collectes COOPECA.
 *
 * Permet d'enregistrer une collecte journalière rattachée à un dossier.
 *
 * Règles métier appliquées :
 * - Une collecte référence un dossier ; le client est dérivé du dossier.
 * - Montant en entier XAF, jamais de flottant.
 * - Référence provisoire générée localement ; numéro officiel alloué serveur.
 * - Date/heure déclarée sur l'appareil distincte de l'instant de réception serveur.
 * - Trois axes d'état : sync / métier / impression.
 * - Enregistrement hors ligne, en attente de synchronisation.
 */
export default function CollectesScreen() {
  const [collectes, setCollectes] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [agenceId, setAgenceId] = useState('agence-centre');
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [montant, setMontant] = useState<string>('');
  const [dateHeureDeclaree, setDateHeureDeclaree] = useState(
    new Date().toISOString(),
  );
  const [referenceProvisoire, setReferenceProvisoire] = useState('');
  const [collecteACréer, setCollecteACréer] = useState<any | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      setChargement(true);
      const [listeDossiers, listeCollectes] = await Promise.all([
        dossierRepository.findByAgence(agenceId),
        collecteRepository.findByDossier(dossierId || ''),
      ]);
      setDossiers(listeDossiers);
      setCollectes(listeCollectes);
    } catch (e) {
      setDossiers([]);
      setCollectes([]);
    } finally {
      setChargement(false);
    }
  }

  async function genererReferenceProvisoire() {
    const seq = Date.now().toString().slice(-6);
    setReferenceProvisoire(`REC-${new Date().toISOString().slice(0, 10)}-${seq}`);
  }

  async function creerCollecte() {
    if (!dossierId || !montant || !referenceProvisoire) return;

    const montantEntier = parseInt(montant, 10);
    if (isNaN(montantEntier) || montantEntier <= 0) {
      setErreur('Le montant doit être un entier positif en XAF.');
      return;
    }

    const cleIdempotence = `collecte-${Date.now()}`;
    const nouvelleCollecte = {
      id: cleIdempotence,
      reference_provisoire: referenceProvisoire,
      client_receipt_no: null,
      dossier_id: dossierId,
      client_id: '', // dérivé du dossier, conservé pour compatibilité
      montant_xaf: montantEntier,
      date_heure_declaree: dateHeureDeclaree,
      statut: BusinessStatusCollecte.ENREGISTRÉE_LOCAL,
      cle_idempotence: cleIdempotence,
      sync_status: SyncStatus.DRAFT,
      print_status: PrintStatus.NON_IMPRIMÉ,
      date_maj: new Date().toISOString(),
    };

    try {
      await collecteRepository.create(nouvelleCollecte);
      setCollecteACréer(nouvelleCollecte);
      setDialogVisible(true);
      setMontant('');
      setReferenceProvisoire('');
      setErreur(null);
      await chargerDonnees();
    } catch (e) {
      setErreur("Impossible d'enregistrer la collecte.");
    }
  }

  function confirmerCreation() {
    setDialogVisible(false);
    setCollecteACréer(null);
  }

  function annulerCreation() {
    setDialogVisible(false);
    setCollecteACréer(null);
  }

  const statutPillKind = (s: string) => {
    switch (s) {
      case 'ACCEPTÉE':
        return 'online' as const;
      case 'ENREGISTRÉE_LOCAL':
        return 'pending' as const;
      case 'EN_ATTENTE':
        return 'pending' as const;
      case 'REJETÉE':
      case 'CONFLIT':
        return 'error' as const;
      default:
        return 'unknown' as const;
    }
  };

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>COOPECA · COLLECTES</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Collectes
          </Text>
          <Text style={styles.subtitle}>
            Enregistrer une collecte journalière rattachée à un dossier
          </Text>
        </View>

        {chargement ? (
          <View style={styles.chargement}>
            <Text style={styles.texteChargement}>Chargement…</Text>
          </View>
        ) : null}

        {erreur ? (
          <AppNotice title="Erreur" body={erreur} kind="error" />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nouvelle collecte</Text>
          <SelecteurDossier
            label="Dossier"
            value={dossierId}
            options={dossiers}
            onValueChange={(v) => {
              setDossierId(v);
              genererReferenceProvisoire();
            }}
            accessibilityLabel="Sélecteur de dossier"
          />
          <InputMontantXAF
            label="Montant (XAF, entier)"
            value={montant}
            onChangeText={setMontant}
            placeholder="0"
          />
          <InputTexte
            label="Date/heure déclarée"
            value={dateHeureDeclaree}
            onChangeText={setDateHeureDeclaree}
            placeholder="Ex. 2026-10-19T08:00:00Z"
            required
          />
          <InputTexte
            label="Référence provisoire"
            value={referenceProvisoire}
            onChangeText={setReferenceProvisoire}
            required
          />
          <Pressable
            style={styles.boutonCreer}
            onPress={creerCollecte}
            disabled={!dossierId || !montant || !referenceProvisoire}
          >
            <Text style={styles.texteBoutonCreer}>
              Enregistrer la collecte (local, en attente de sync)
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Collectes enregistrées ({collectes.length})
          </Text>
          {collectes.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.texteVide}>
                Aucune collecte pour le moment. Saisissez-en une ci-dessus.
              </Text>
            </View>
          ) : (
            collectes.map((c) => (
              <View key={c.id} style={styles.ligneCollecte}>
                <View style={styles.infosCollecte}>
                  <Text style={styles.refCollecte}>
                    {c.reference_provisoire}
                  </Text>
                  <Text style={styles.montantCollecte}>
                    {formatMontantXAF(c.montant_xaf)}
                  </Text>
                </View>
                <View style={styles.badgesCollecte}>
                  <StatusPill kind={statutPillKind(c.statut)} label={c.statut} />
                  <StatusPill
                    kind={c.sync_status === 'SYNCED' ? 'online' : 'pending'}
                    label={c.sync_status}
                  />
                  <StatusPill
                    kind={c.print_status === 'IMPRIMÉ' ? 'online' : 'pending'}
                    label={c.print_status}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.noteBas}>
          <Text style={styles.te   xteNote}>
            Le montant est stocké en entier XAF. La référence provisoire est
            générée localement ; le numéro officiel sera alloué par le serveur
            à l'acceptation.
          </Text>
        </View>
      </ScrollView>

      <DialogConfirmation
        visible={dialogVisible}
        title="Collecte enregistrée"
        message={
          collecteACréer
            ? `La collecte ${collecteACréer.reference_provisoire} de ${formatMontantXAF(collecteACréer.montant_xaf)} a été enregistrée localement (en attente de synchronisation).`
            : ''
        }
        confirmLabel="OK"
        cancelLabel=""
        onConfirm={confirmerCreation}
        onCancel={annulerCreation}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    gap: 8,
    paddingTop: 4,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  boutonCreer: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  texteBoutonCreer: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  ligneCollecte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  infosCollecte: {
    flex: 1,
    gap: 2,
  },
  refCollecte: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  montantCollecte: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  badgesCollecte: {
    flexDirection: 'row',
    gap: 6,
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
  chargement: {
    padding: 24,
    alignItems: 'center',
  },
  texteChargement: {
    color: colors.muted,
    fontSize: 14,
  },
  noteBas: {
    marginTop: 16,
    padding: 14,
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
  },
  texteNote: {
    color: colors.accent,
    fontSize: 12,
    lineHeight: 18,
  },
});
