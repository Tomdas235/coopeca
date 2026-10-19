import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from './theme';

export type Option = {
  label: string;
  value: string;
};

/**
 * Sélecteur déroulant simple COOPECA.
 *
 * Affiche la valeur sélectionnée dans un champ tactile. Au toucher, la liste
 * des options s'affiche en dessous du champ. Composant contrôlé : le parent
 * gère `value` et `onValueChange`.
 */
export interface SelecteurSimpleProps {
  /** Libellé affiché au-dessus du champ. */
  label: string;
  /** Valeur actuellement sélectionnée (ou null si aucune). */
  value: string | null;
  /** Liste des options disponibles. */
  options: Option[];
  /** Callback appelé quand une option est sélectionnée. */
  onValueChange: (value: string) => void;
  /** Texte affiché quand aucune option n'est sélectionnée. */
  placeholder?: string;
  /** Message d'erreur personnalisé optionnel. */
  error?: string;
  /** Désactive la saisie. */
  disabled?: boolean;
  /** Libellé d'accessibilité pour le champ. */
  accessibilityLabel?: string;
}

export function SelecteurSimple({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Sélectionner…',
  error,
  disabled = false,
  accessibilityLabel,
}: SelecteurSimpleProps) {
  const [ouvert, setOuvert] = React.useState<boolean>(false);
  const optionSelectionnee =
    value !== null ? options.find((o) => o.value === value) : null;

  const afficherValeur = optionSelectionnee
    ? optionSelectionnee.label
    : placeholder;

  const toggleSelecteur = () => {
    if (!disabled) {
      setOuvert((o) => !o);
    }
  };

  const selectionner = (valeur: string) => {
    onValueChange(valeur);
    setOuvert(false);
  };

  const fermeSelecteur = () => {
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
        <Text style={styles.texteChamp}>{afficherValeur}</Text>
        <Text style={styles.fleche}>{ouvert ? '▲' : '▾'}</Text>
      </Pressable>

      {error ? <Text style={styles.erreur}>{error}</Text> : null}

      {ouvert && (
        <View style={styles.liste}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={fermeSelecteur}
            accessibilityRole="button"
            accessibilityLabel="Fermer le sélecteur"
          />
          <View style={styles.listePanel}>
            <Text style={styles.listeTitle}>{label}</Text>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={styles.option}
                onPress={() => selectionner(option.value)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={option.label}
              >
                <Text style={styles.optionTexte}>{option.label}</Text>
              </Pressable>
            ))}
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
  texteChamp: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
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
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralSoft,
  },
  optionTexte: {
    color: colors.text,
    fontSize: 16,
  },
});
