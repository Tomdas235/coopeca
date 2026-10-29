import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppCard } from '../../src/components/AppCard';
import { AppNotice } from '../../src/components/AppNotice';
import { AppScreen } from '../../src/components/AppScreen';
import { InputMontantXAF } from '../../src/components/InputMontantXAF';
import { InputTexte } from '../../src/components/InputTexte';
import { MetricCard } from '../../src/components/MetricCard';
import { StatusPill, type StatusKind } from '../../src/components/StatusPill';
import { SyncStatusBanner } from '../../src/components/SyncStatusBanner';
import { colors } from '../../src/components/theme';
import {
  ApiError,
  createMarket,
  depositToCycle,
  getCycle,
  listMarkets,
  type CycleSummary,
  type MarketRef,
  type TontineCycleStatus,
} from '../../src/services/api';
import { formatMontantXAF } from '../../src/utils/montants';

const libelleStatut: Record<TontineCycleStatus, string> = {
  ACTIVE: 'ACTIF',
  SUSPENDED: 'SUSPENDU',
  COMPLETED: 'COMPLET',
  CLOSED: 'CLÔTURÉ',
};

const pastilleStatut: Record<TontineCycleStatus, StatusKind> = {
  ACTIVE: 'online',
  SUSPENDED: 'pending',
  COMPLETED: 'online',
  CLOSED: 'offline',
};

/** Affiche un montant XAF sérialisé par l'API, sans jamais le convertir en flottant. */
function montantAffiche(valeur: string): string {
  const nombre = Number.parseInt(valeur, 10);
  return Number.isSafeInteger(nombre) ? formatMontantXAF(nombre) : `${valeur} XAF`;
}

function messageErreur(erreur: unknown): string {
  if (erreur instanceof ApiError) return erreur.message;
  if (erreur instanceof Error) return erreur.message;
  return 'Erreur inattendue.';
}

/**
 * Écran Cycles COOPECA — versements fixes sur un cycle à 31 versements.
 *
 * Contrat serveur (backend/src/cycles/cycles.controller.ts) :
 * - `GET /markets` liste les marchés actifs ;
 * - `POST /markets` crée un marché (ADMIN/SUPERVISOR) ;
 * - `GET /tontine-cycles/{id}` renvoie la progression et le solde du cycle ;
 * - `POST /tontine-cycles/{id}/deposits` enregistre un versement idempotent.
 *
 * Un versement porte toujours sur un cycle identifié ; le cycle provient du
 * dossier du client (écran Dossiers), jamais d'un marché.
 */
export default function CyclesScreen() {
  const [marches, setMarches] = useState<MarketRef[]>([]);
  const [chargementMarches, setChargementMarches] = useState(true);
  const [codeMarche, setCodeMarche] = useState('');
  const [nomMarche, setNomMarche] = useState('');
  const [identifiantCycle, setIdentifiantCycle] = useState('');
  const [montantVersement, setMontantVersement] = useState('');
  const [cycle, setCycle] = useState<CycleSummary | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const chargerMarches = useCallback(async () => {
    setChargementMarches(true);
    try {
      const liste = await listMarkets();
      setMarches(liste);
    } catch (cause) {
      setMarches([]);
      setErreur(messageErreur(cause));
    } finally {
      setChargementMarches(false);
    }
  }, []);

  useEffect(() => {
    void chargerMarches();
  }, [chargerMarches]);

  async function enregistrerMarche() {
    setErreur(null);
    setConfirmation(null);

    if (codeMarche.trim() === '' || nomMarche.trim() === '') {
      setErreur('Renseignez le code et le nom du marché.');
      return;
    }

    setEnCours(true);
    try {
      const marche = await createMarket({ code: codeMarche, name: nomMarche });
      setCodeMarche('');
      setNomMarche('');
      setConfirmation(`Marché ${marche.code} créé.`);
      await chargerMarches();
    } catch (cause) {
      setErreur(messageErreur(cause));
    } finally {
      setEnCours(false);
    }
  }

  async function chargerCycle() {
    const id = identifiantCycle.trim();
    setErreur(null);
    setConfirmation(null);

    if (id === '') {
      setErreur('Renseignez l’identifiant du cycle.');
      return;
    }

    setEnCours(true);
    try {
      setCycle(await getCycle(id));
    } catch (cause) {
      setCycle(null);
      setErreur(messageErreur(cause));
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrerVersement() {
    const id = identifiantCycle.trim();
    const montant = Number.parseInt(montantVersement.replace(/\s/g, ''), 10);
    setErreur(null);
    setConfirmation(null);

    if (id === '') {
      setErreur('Renseignez l’identifiant du cycle.');
      return;
    }
    if (!Number.isSafeInteger(montant) || montant <= 0) {
      setErreur('Le montant du versement doit être un entier XAF strictement positif.');
      return;
    }
    if (cycle !== null && cycle.fixedAmountXaf !== String(montant)) {
      setErreur(
        `Le versement doit être égal au montant fixe du cycle (${montantAffiche(cycle.fixedAmountXaf)}).`,
      );
      return;
    }

    setEnCours(true);
    try {
      const resultat = await depositToCycle(id, montant);
      setMontantVersement('');
      setConfirmation(
        resultat.replayed
          ? 'Versement déjà enregistré : rejeu idempotent, aucun doublon créé.'
          : 'Versement enregistré.',
      );
      // La progression est relue après coup : un échec de lecture ne doit pas
      // masquer le succès du versement.
      try {
        setCycle(await getCycle(id));
      } catch {
        // progression indisponible : le versement reste confirmé
      }
    } catch (cause) {
      setErreur(messageErreur(cause));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COOPECA · CYCLES</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Versements
        </Text>
        <Text style={styles.subtitle}>
          Cycle à 31 versements fixes, sans limite calendaire
        </Text>
      </View>

      <SyncStatusBanner />

      {erreur ? <AppNotice title="Erreur" body={erreur} kind="error" /> : null}
      {confirmation ? <AppNotice title="Confirmé" body={confirmation} kind="success" /> : null}

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Marchés actifs</Text>
          <Text style={styles.compteur}>{marches.length}</Text>
        </View>
        {chargementMarches ? (
          <ActivityIndicator />
        ) : marches.length === 0 ? (
          <Text style={styles.texteVide}>Aucun marché actif pour le moment.</Text>
        ) : (
          marches.map((marche) => (
            <View key={marche.id} style={styles.ligne}>
              <Text style={styles.marcheCode}>{marche.code}</Text>
              <Text style={styles.marcheNom}>{marche.name}</Text>
            </View>
          ))
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Nouveau marché</Text>
          <InputTexte
            label="Code"
            value={codeMarche}
            onChangeText={setCodeMarche}
            placeholder="Ex. MKT-001"
            required
          />
          <InputTexte
            label="Nom"
            value={nomMarche}
            onChangeText={setNomMarche}
            placeholder="Ex. Marché central"
            required
          />
          <AppButton
            label="Créer le marché"
            onPress={() => {
              void enregistrerMarche();
            }}
            disabled={enCours}
          />
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Versement sur un cycle</Text>
        <InputTexte
          label="Identifiant du cycle"
          value={identifiantCycle}
          required
          placeholder="UUID du cycle (dossier du client)"
          onChangeText={setIdentifiantCycle}
        />
        <InputMontantXAF
          label="Montant du versement"
          value={montantVersement}
          placeholder="1 500"
          onChangeText={setMontantVersement}
          disabled={enCours}
        />
        {cycle ? (
          <Text style={styles.aide}>
            Montant fixe du cycle : {montantAffiche(cycle.fixedAmountXaf)}
          </Text>
        ) : null}
        <AppButton
          label="Charger le cycle"
          variant="secondary"
          onPress={() => {
            void chargerCycle();
          }}
          disabled={enCours}
        />
        <AppButton
          label="Enregistrer le versement"
          onPress={() => {
            void enregistrerVersement();
          }}
          disabled={enCours}
        />
      </AppCard>

      {cycle ? (
        <AppCard>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cycle en cours</Text>
            <StatusPill
              kind={pastilleStatut[cycle.status]}
              label={libelleStatut[cycle.status]}
            />
          </View>
          <View style={styles.metriques}>
            <MetricCard
              label="Versements comptabilisés"
              value={`${cycle.installmentCount} / ${cycle.targetInstallments}`}
              note="Objectif du cycle"
            />
            <MetricCard
              label="Total collecté"
              value={montantAffiche(cycle.totalCollectedXaf)}
            />
            <MetricCard
              label="Solde disponible"
              value={montantAffiche(cycle.availableBalanceXaf)}
              note={cycle.commissionPaid ? 'Commission déjà prélevée' : 'Commission non prélevée'}
            />
          </View>
          <Text style={styles.identifiant}>Cycle {cycle.id}</Text>
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 6,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  compteur: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  marcheCode: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  marcheNom: {
    color: colors.text,
    fontSize: 14,
    flexShrink: 1,
  },
  texteVide: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  aide: {
    color: colors.muted,
    fontSize: 12,
    marginTop: -6,
  },
  metriques: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  identifiant: {
    color: colors.muted,
    fontSize: 11,
  },
});
