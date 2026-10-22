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
import { SelecteurSimple } from '../../src/components/SelecteurSimple';
import { StatusPill } from '../../src/components/StatusPill';
import { DialogConfirmation } from '../../src/components/DialogConfirmation';
import { AppNotice } from '../../src/components/AppNotice';
import { colors } from '../../src/components/theme';
import {
  dossierRepository,
  clientRepository,
} from '../../src/database/repositories';

/**
 * Écran Dossiers COOPECA.
 *
 * Permet de consulter les dossiers de l'agence et d'en créer un nouveau.
 *
 * Règles métier appliquées :
 * - Un dossier appartient à un client et une agence.
 * - Un seul dossier ouvert par client et par agence.
 * - Un dossier créé hors ligne a le statut OUVERT, en attente d'acceptation serveur.
 * - La référence provisoire est générée localement (DOSS-YYYYMMDD-seq).
 */
export default function DossiersScreen() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [agenceId, setAgenceId] = useState('agence-centre');
  const [clientId, setClientId] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [dateCreation, setDateCreation] = useState(new Date().toISOString());
  const [dossierACréer, setDossierACréer] = useState<any | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      setChargement(true);
      const [listeDossiers, listeClients] = await Promise.all([
        dossierRepository.findByAgence(agenceId),
        clientRepository.findByAgence(agenceId),
      ]);
      setDossiers(listeDossiers);
      setClients(listeClients);
    } catch (e) {
      setDossiers([]);
      setClients([]);
    } finally {
      setChargement(false);
    }
  }

  async function verifierDossierOuvert() {
    if (!clientId) return;
    const ouverts = await dossierRepository.findOuvertsByClientEtAgence(
      clientId,
      agenceId,
    );
    return ouverts.length > 0;
  }

  async function creerDossier() {
    if (!clientId || !reference) return;

    const dejaOuvert = await verifierDossierOuvert();
    if (dejaOuvert) {
      setErreur(
        'Un dossier est déjà ouvert pour ce client dans cette agence.',
      );
      return;
    }

    const cleIdempotence = `dossier-${Date.now()}`;
    const nouveauDossier = {
      id: cleIdempotence,
      reference_provisoire: reference,
      client_id: clientId,
      agence_id: agenceId,
      statut: 'OUVERT' as const,
      date_creation_declaree: dateCreation,
      cle_idempotence: cleIdempotence,
      sync_status: 'DRAFT' as const,
      date_maj: new Date().toISOString(),
    };

    try {
      await dossierRepository.create(nouveauDossier);
      setDossierACréer(nouveauDossier);
      setDialogVisible(true);
      setReference('');
      setErreur(null);
      await chargerDonnees();
    } catch (e) {
      setErreur("Impossible de créer le dossier.");
    }
  }

  function confirmerCreation() {
    setDialogVisible(false);
    setDossierACréer(null);
  }

  function annulerCreation() {
    setDialogVisible(false);
    setDossierACréer(null);
  }

  const statutPillKind = (s: string) => {
    switch (s) {
      case 'OUVERT':
        return 'warning' as const;
      case 'FERME':
        return 'success' as const;
      case 'REJETE':
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
          <Text style={styles.eyebrow}>COOPECA · DOSSIERS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Dossiers
          </Text>
          <Text style={styles.subtitle}>
            Consulter et créer des dossiers (agence : {agenceId})
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
          <Text style={styles.cardTitle}>Créer un dossier</Text>
          <SelecteurSimple
            label="Client"
            value={clientId}
            options={clients.map((c) => ({
              label: `${c.prenom} ${c.nom}`,
              value: c.id,
            }))}
            onValueChange={(v) => setClientId(v)}
            accessibilityLabel="Sélecteur de client"
          />
          <InputTexte
            label="Référence provisoire"
            value={reference}
            onChangeText={setReference}
            placeholder="Ex. DOSS-20261019-001"
            required
          />
          <InputTexte
            label="Date de création (déclarée)"
            value={dateCreation}
            onChangeText={setDateCreation}
            placeholder="Ex. 2026-10-19T08:00:00Z"
            required
          />
          {erreur ? (
            <AppNotice title="Erreur" body={erreur} kind="error" />
          ) : null}
          <Pressable
            style={styles.boutonCreer}
            onPress={creerDossier}
            disabled={!clientId || !reference}
          >
            <Text style={styles.texteBoutonCreer}>
              Créer le dossier (statut : OUVERT)
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dossiers de l'agence ({dossiers.length})
          </Text>
          {dossiers.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.texteVide}>
                Aucun dossier pour le moment. Créez-en un ci-dessus.
              </Text>
            </View>
          ) : (
            dossiers.map((d) => (
              <View key={d.id} style={styles.ligneDossier}>
                <View style={styles.infosDossier}>
                  <Text style={styles.refDossier}>{d.reference_provisoire}</Text>
                  <Text style={styles.clientDossier}>
                    Client : {d.client_id}
                  </Text>
                </View>
                <View style={styles.badgesDossier}>
                  <StatusPill kind={statutPillKind(d.statut)} label={d.statut} />
                  <StatusPill
                    kind={
                      d.sync_status === 'SYNCED'
                        ? ('success' as const)
                        : ('pending' as const)
                    }
                    label={d.sync_status}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.noteBas}>
          <Text style={styles.texteNote}>
            Un seul dossier ouvert est autorisé par client et par agence. Un
            dossier créé hors ligne reste en attente d'acceptation par le
            serveur.
          </Text>
        </View>
      </ScrollView>

      <DialogConfirmation
        visible={dialogVisible}
        title="Dossier créé"
        message={
          dossierACréer
            ? `Le dossier ${dossierACréer.reference_provisoire} a été enregistré localement (statut OUVERT).`
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
    color: colors.accent,
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
  ligneDossier: {
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
  infosDossier: {
    flex: 1,
    gap: 2,
  },
  refDossier: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  clientDossier: {
    color: colors.muted,
    fontSize: 13,
  },
  badgesDossier: {
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
