import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from './theme';
import { StatusPill } from './StatusPill';

/**
 * Représentation minimale d’un dossier (squelette).
 *
 * Les données réelles proviendront de `src/database/repositories` une fois
 * `expo-sqlite` installé et le schéma local validé (décision ouverte n°7,
 * docs/DECISIONS_METIER.md §3-4).
 */
export type DossierResume = {
  id: string;
  referenceProvisoire: string; // ex. DOSS-20261019-001 (générée localement)
  clientNom: string;
  statut: 'OUVERT' | 'FERME' | 'REJETE';
  syncStatus: 'DRAFT' | 'PENDING' | 'SYNCED' | 'CONFLICT' | 'ERROR';
  agenceId: string;
  dateCreationDeclairee: string; // ISO, distincte de l'instant de réception serveur
};

/**
 * Sélecteur de dossier COOPECA.
 *
 * Règles métier appliquées (décisions validées) :
 * - Un seul dossier ouvert par client et par agence (APP_FLOW §6).
 * - Un dossier créé hors ligne porte le statut PROVISOIRE jusqu’à acceptation serveur.
 * - La référence provisoire est générée localement ; le numéro officiel est alloué par le serveur.
 * - Trois axes d’état indépendants : synchronisation, métier, impression.
 */
export interface SelecteurDossierProps {
  /** Libellé affiché au-dessus du champ. */
  label: string;
  /** Identifiant du dossier sélectionné (null si aucun). */
  value: string | null;
  /** Callback appelé quand un dossier est sélectionné. */
  onValueChange: (value: string) => void;
  /** Désactive la saisie. */
  disabled?: boolean;
  /** Message d’erreur personnalisé optionnel. */
  error?: string;
  /** Libellé d’accessibilité pour le champ. */
  accessibilityLabel?: string;
  /** Liste des dossiers disponibles (fournie par le repository ou le parent). */
  options?: DossierResume[];
}

export function SelecteurDossier({
  label,
  value,
  onValueChange,
  disabled = false,
  error,
  accessibilityLabel,
  options = [],
}: SelecteurDossierProps) {
  const [ouvert, setOuvert] = React.useState<boolean>(false);

  // TODO : remplacer par les données réelles du repository une fois expo-sqlite installé.
  // À ce stade, aucune donnée métier n’est affichée ni enregistrée (AGENTS.md §85-92).
  const dossiers: DossierResume[] = options;

  const dossierSelectionne =
    value !== null ? dossiers.find((d) => d.id === value) : null;

  const afficherValeur = dossierSelectionne
    ? dossierSelectionne.referenceProvisoire
    : 'Sélectionner un dossier…';

  const toggleSelecteur = () => {
    if (!disabled) {
      setOuvert((o) => !o);
    }
  };

  const selectionner = (id: string) => {
    onValueChange(id);
    setOuvert(false);
  };

  const fermetureSelecteur = () => {
    setOuvert(false);
  };

  const pillKind = (sync: DossierResume['syncStatus']) => {
    switch (sync) {
      case 'SYNCED':
        return 'success';
      case 'PENDING':
        return 'pending';
      case 'CONFLICT':
      case 'ERROR':
        return 'error';
      default:
        return 'unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Pressable
        style={[styles.champ, error && styles.champErreur, ouvert && styles.champOuvert]}
        onPress={toggleSelecteur}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled, expanded: ouvert }}
      >
        <View style={styles.champContent}>
          <Text style={styles.texteChamp}>{afficherValeur}</Text>
          {dossierSelectionne ? (
            <View style={styles.badges}>
              <StatusPill
                kind={pillKind(dossierSelectionne.syncStatus)}
                label={dossierSelectionne.syncStatus}
              />
              <StatusPill
                kind="warning"
                label={dossierSelectionne.statut}
              />
            </View>
          ) : null}
          <Text style={styles.fleche}>{ouvert ? '▲' : '▾'}</Text>
        </View>
      </Pressable>

      {error ? <Text style={styles.erreur}>{error}</Text> : null}

      {/* TODO : lorsque le repository sera opérationnel, afficher ici les dossiers
           ouverts du client/agence connecté, avec un avertissement si le dossier
           est en statut PROVISOIRE (en attente de validation serveur). */}
      {ouvert && (
        <View style={styles.liste}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={fermetureSelecteur}
            accessibilityRole="button"
            accessibilityLabel="Fermer le sélecteur de dossier"
          />
          <View style={styles.listePanel}>
            <Text style={styles.listeTitle}>{label}</Text>
            {dossiers.length === 0 ? (
              <View style={styles.vide}>
                <Text style={styles.videTexte}>
                  Aucun dossier disponible pour ce client.
                </Text>
                <Text style={styles.videSousTitre}>
                  Créez un dossier depuis l’écran Dossiers.
                </Text>
              </View>
            ) : (
              dossiers.map((dossier) => (
                <Pressable
                  key={dossier.id}
                  style={styles.option}
                  onPress={() => selectionner(dossier.id)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={dossier.referenceProvisoire}
                >
                  <View style={styles.optionRow}>
                    <Text style={styles.optionTexte}>
                      {dossier.referenceProvisoire}
                    </Text>
                    <StatusPill
                      kind={pillKind(dossier.syncStatus)}
                      label={dossier.syncStatus}
                    />
                  </View>
                  <Text style={styles.optionDetail}>
                    {dossier.clientNom} · {dossier.agenceId}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  champ: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  champOuvert: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  champErreur: {
    borderColor: colors.danger,
  },
  champContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  texteChamp: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 10,
  },
  fleche: {
    color: colors.muted,
    fontSize: 14,
  },
  erreur: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 2,
  },
  liste: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRadius: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: -1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  listePanel: {
    padding: 8,
    maxHeight: 260,
  },
  listeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  vide: {
    padding: 16,
    alignItems: 'center',
  },
  videTexte: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  videSousTitre: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralSoft,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTexte: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  optionDetail: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});