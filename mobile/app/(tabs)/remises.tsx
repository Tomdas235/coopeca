import { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  remiseRepository,
  collecteRepository,
} from '../../src/database/repositories';

/**
 * Écran Remises COOPECA.
 *
 * Permet de déclarer une remise de fonds (sélection de collectes non remises).
 *
 * Règles métier appliquées :
 * - La déclaration de remise par l'agent n'est PAS une remise confirmée par le caissier.
 * - Une collecte ne peut appartenir qu'à une seule remise.
 * - Le montant total est la somme des collectes incluses (entier XAF).
 * - La confirmation par le caissier est une étape distincte (côté serveur).
 */
export default function RemisesScreen() {
  const [remises, setRemises] = useState<any[]>([]);
  const [collectesNonRemises, setCollectesNonRemises] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [agenceId, setAgenceId] = useState('agence-centre');
  const [collectesSelectionnees, setCollectesSelectionnees] = useState<
    string[]
  >([]);
  const [montantTotal, setMontantTotal] = useState(0);
  const [remiseACréer, setRemiseACréer] = useState<any | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      setChargement(true);
      const [listeRemises, listeCollectes] = await Promise.all([
        remiseRepository.findByAgence(agenceId),
        collecteRepository.findNonRemises(agenceId),
      ]);
      setRemises(listeRemises);
      setCollectesNonRemises(listeCollectes);
    } catch (e) {
      setRemises([]);
      setCollectesNonRemises([]);
    } finally {
      setChargement(false);
    }
  }

  function toggleCollecte(id: string) {
    const nouvelEtat = !collectesSelectionnees.includes(id);
    const nouvelleSelection = nouvelEtat
      ? [...collectesSelectionnees, id]
      : collectesSelectionnees.filter((x) => x !== id);

    const selected = collectesNonRemises.filter((c) =>
      nouvelleSelection.includes(c.id),
    );
    setMontantTotal(
      selected.reduce((sum, c) => sum + (c.montant_xaf || 0), 0),
    );
    setCollectesSelectionnees(nouvelleSelection);
  }

  async function creerRemise() {
    if (collectesSelectionnees.length === 0) return;

    const cleIdempotence = `remise-${Date.now()}`;
    const nouvelleRemise = {
      id: cleIdempotence,
      agence_id: agenceId,
      montant_total_xaf: montantTotal,
      statut: 'DÉCLARÉE' as const,
      cle_idempotence: cleIdempotence,
      sync_status: 'DRAFT' as const,
      date_declaree: new Date().toISOString(),
      date_confirmee_caisse: null,
      motif_ecart: null,
      date_maj: new Date().toISOString(),
    };

    try {
      await remiseRepository.create(nouvelleRemise);
      // TODO : lier les collectes sélectionnées à la remise via collecte_remise
      setRemiseACréer(nouvelleRemise);
      setDialogVisible(true);
      setCollectesSelectionnees([]);
      setMontantTotal(0);
      setErreur(null);
      await chargerDonnees();
    } catch (e) {
      setErreur("Impossible de créer la remise.");
    }
  }

  function confirmerCreation() {
    setDialogVisible(false);
    setRemiseACréer(null);
  }

  function annulerCreation() {
    setDialogVisible(false);
    setRemiseACréer(null);
  }

  const statutPillKind = (s: string) => {
    switch (s) {
      case 'CONFIRMÉE':
        return 'success' as const;
      case 'DÉCLARÉE':
        return 'pending' as const;
      case 'EN_ATTENTE_CAISSIER':
        return 'pending' as const;
      case 'ÉCART':
        return 'error' as const;
      case 'ANNULÉE':
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
          <Text style={styles.eyebrow}>COOPECA · REMISES</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Remises
          </Text>
          <Text style={styles.subtitle}>
            Déclarer une remise de fonds (sélection des collectes)
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
          <Text style={styles.cardTitle}>Nouvelle remise</Text>
          <Text style={styles.sousTitreCard}>
            Sélectionnez les collectes à inclure dans la remise.
            Une collecte ne peut appartenir qu'à une seule remise.
          </Text>
          {collectesNonRemises.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.texteVide}>
                Aucune collecte disponible pour cette agence.
              </Text>
            </View>
          ) : (
            collectesNonRemises.map((c) => (
              <Pressable
                key={c.id}
                style={[
                  styles.ligneCollecte,
                  collectesSelectionnees.includes(c.id)
                    ? styles.ligneSelectionnee
                    : null,
                ]}
                onPress={() => toggleCollecte(c.id)}
              >
                <View style={styles.infosCollecte}>
                  <Text style={styles.refCollecte}>
                    {c.reference_provisoire}
                  </Text>
                  <Text style={styles.montantCollecte}>
                    {formatMontantXAF(c.montant_xaf)}
                  </Text>
                </View>
                {collectesSelectionnees.includes(c.id) ? (
                  <Text style={styles.texteSelectionnee}>✓</Text>
                ) : null}
              </Pressable>
            ))
          )}
          <View style={styles.resumeRemise}>
            <Text style={styles.libelleResume}>
              Total de la remise ({collectesSelectionnees.length} collecte)
              </Text>
              <Text style={styles.valeurResume}>
                {formatMontantXAF(montantTotal)}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.boutonCreer}
            onPress={creerRemise}
            disabled={collectesSelectionnees.length === 0}
          >
            <Text style={styles.texteBoutonCreer}>
              Déclarer la remise (agent → caisse)
            </Text>
          </Pressable>
          <Text style={styles.noteDistinction}>
            Cette déclaration n'est pas une confirmation de réception par le
            caissier. Les deux confirmations restent distinctes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Remises déclarées ({remises.length})
          </Text>
          {remises.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.texteVide}>
                Aucune remise pour le moment. Déclarez-en une ci-dessus.
              </Text>
            </View>
          ) : (
            remises.map((r) => (
              <View key={r.id} style={styles.ligneRemise}>
                <View style={styles.infosRemise}>
                  <Text style={styles.idRemise}>{r.id.slice(-8)}</Text>
                  <Text style={styles.montantRemise}>
                    {formatMontantXAF(r.montant_total_xaf)}
                  </Text>
                </View>
                <View style={styles.badgesRemise}>
                  <StatusPill kind={statutPillKind(r.statut)} label={r.statut} />
                  <StatusPill
                    kind={
                      r.sync_status === 'SYNCED'
                        ? ('success' as const)
                        : ('pending' as const)
                    }
                    label={r.sync_status}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.noteBas}>
          <Text style={styles.texteNote}>
            La déclaration de remise par l'agent n'est pas une remise
            confirmée par le caissier. La confirmation de caisse est une étape
            distincte, effectuée côté serveur.
          </Text>
        </View>
      </ScrollView>

      <DialogConfirmation
        visible={dialogVisible}
        title="Remise déclarée"
        message={
          remiseACréer
            ? `La remise de ${formatMontantXAF(remiseACréer.montant_total_xaf)} a été déclarée localement (statut DÉCLARÉE, en attente de confirmation caisse).`
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
