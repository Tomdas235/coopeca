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
 * Représentation minimale d’un client (squelette).
 *
 * Les données réelles proviendront de `src/database/repositories` une fois
 * `expo-sqlite` installé et le schéma local validé (décision ouverte n°7,
 * docs/DECISIONS_METIER.md §3-4).
 *
 * Règles métier appliquées (décisions validées) :
 * - Un client créé hors ligne porte le statut PROVISOIRE jusqu’à acceptation
 *   par le serveur (docs/DECISIONS_METIER §2.2, AGENTS.md §4.2).
 * - Un doublon client potentiel (téléphone normalisé et nom/prénom dans la
 *   même agence) déclenche une revue, jamais une fusion automatique. Seul un
 *   superviseur habilité décide la fusion (docs/DECISIONS_METIER §4).
 * - La fiche source reste un alias audité ; les liens financiers historiques
 *   ne sont pas réécrits.
 */
export type ClientResume = {
  id: string;
  nom: string;
  prenom: string;
  telephoneNormalise: string; // ex. +23566123456
  statut: 'PROVISOIRE' | 'CONFIRME';
  agenceId: string;
  dateCreationDeclairee: string; // ISO, distincte de l'instant de réception serveur
  doublonPotentiel: boolean; // true si un doublon potentiel est détecté
};

/**
 * Sélecteur de client COOPECA.
 *
 * Affiche le client sélectionné avec son statut (PROVISOIRE / CONFIRME) et
 * alerte visuellement en cas de doublon potentiel. Composant contrôlé :
 * le parent gère `value` et `onValueChange`.
 */
export interface SelecteurClientProps {
  /** Libellé affiché au-dessus du champ. */
  label: string;
  /** Identifiant du client sélectionné (null si aucun). */
  value: string | null;
  /** Callback appelé quand un client est sélectionné. */
  onValueChange: (value: string) => void;
  /** Désactive la saisie. */
  disabled?: boolean;
  /** Message d’erreur personnalisé optionnel. */
  error?: string;
  /** Libellé d’accessibilité pour le champ. */
  accessibilityLabel?: string;
  /** Liste des clients disponibles (fournie par le repository ou le parent). */
  options?: ClientResume[];
}

export function SelecteurClient({
  label,
  value,
  onValueChange,
  disabled = false,
  error,
  accessibilityLabel,
  options = [],
}: SelecteurClientProps) {
  const [ouvert, setOuvert] = React.useState<boolean>(false);

  // TODO : remplacer par les données réelles du repository une fois expo-sqlite installé.
  // À ce stade, aucune donnée métier n’est affichée ni enregistrée (AGENTS.md §85-92).
  const clients: ClientResume[] = options;

  const clientSelectionne =
    value !== null ? clients.find((c) => c.id === value) : null;

  const afficherValeur = clientSelectionne
    ? `${clientSelectionne.prenom} ${clientSelectionne.nom}`
    : 'Sélectionner un client…';

  const statutPillKind = (statut: ClientResume['statut']) => {
    switch (statut) {
      case 'CONFIRME':
        return 'success';
      case 'PROVISOIRE':
        return 'warning';
      default:
        return 'unknown';
    }
  };

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
          {clientSelectionne ? (
            <View style={styles.badges}>
              <StatusPill
                kind={statutPillKind(clientSelectionne.statut)}
                label={clientSelectionne.statut}
              />
              {clientSelectionne.doublonPotentiel ? (
                <StatusPill kind="warning" label="Doublon potentiel" />
              ) : null}
            </View>
          ) : null}
          <Text style={styles.fleche}>{ouvert ? '▲' : '▾'}</Text>
        </View>
      </Pressable>

      {error ? <Text style={styles.erreur}>{error}</Text> : null}

      {clientSelectionne && clientSelectionne.doublonPotentiel ? (
        <View style={styles.banniereDoublon}>
          <Text style={styles.banniereTitre}>
            Doublon potentiel détecté
          </Text>
          <Text style={styles.banniereTexte}>
            Ce client pourrait déjà exister dans cette agence. Une revue par un
            superviseur habilité est requise avant toute fusion. Aucune fusion
            automatique n’est effectuée.
          </Text>
        </View>
      ) : null}

      {/* TODO : lorsque le repository sera opérationnel, afficher ici les clients
           de l’agence connectée, avec le statut PROVISOIRE pour les créations
           hors ligne et une alerte doublon potentiel (téléphone normalisé +
           nom/prénom) sans fusion automatique. */}
      {ouvert && (
        <View style={styles.liste}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={fermetureSelecteur}
            accessibilityRole="button"
            accessibilityLabel="Fermer le sélecteur de client"
          />
          <View style={styles.listePanel}>
            <Text style={styles.listeTitle}>{label}</Text>
            {clients.length === 0 ? (
              <View style={styles.vide}>
                <Text style={styles.videTexte}>
                  Aucun client disponible pour cette agence.
                </Text>
                <Text style={styles.videSousTitre}>
                  Créez un client depuis l’écran Clients.
                </Text>
              </View>
            ) : (
              clients.map((client) => (
                <Pressable
                  key={client.id}
                  style={styles.option}
                  onPress={() => selectionner(client.id)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`${client.prenom} ${client.nom}`}
                >
                  <View style={styles.optionRow}>
                    <View style={styles.optionInfos}>
                      <Text style={styles.optionTexte}>
                        {client.prenom} {client.nom}
                      </Text>
                      <Text style={styles.optionDetail}>
                        {client.telephoneNormalise}
                      </Text>
                    </View>
                    <StatusPill
                      kind={statutPillKind(client.statut)}
                      label={client.statut}
                    />
                    {client.doublonPotentiel ? (
                      <StatusPill kind="warning" label="Doublon" />
                    ) : null}
                  </View>
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
  banniereDoublon: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  banniereTitre: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '800',
  },
  banniereTexte: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
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
  optionInfos: {
    flex: 1,
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