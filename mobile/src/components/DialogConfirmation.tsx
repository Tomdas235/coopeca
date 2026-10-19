import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from './theme';

/**
 * Dialogue de confirmation COOPECA.
 *
 * Utilisé pour toute action sensible (collecte, remise, clôture, suppression)
 * avant exécution. L'utilisateur doit confirmer explicitement ; l'annulation
 * ou le clic en dehors du panneau n'exécute rien.
 */
export interface DialogConfirmationProps {
  /** Affiche ou masque le dialogue. */
  visible: boolean;
  /** Titre du dialogue. */
  title: string;
  /** Message explicatif de l'action. */
  message: string;
  /** Libellé du bouton confirmer. */
  confirmLabel?: string;
  /** Libellé du bouton annuler. */
  cancelLabel?: string;
  /** Si vrai, le bouton confirmer est rouge (action destructive). */
  destructive?: boolean;
  /** État de chargement : désactive le bouton confirmer pendant un appel. */
  loading?: boolean;
  /** Appelé quand l'utilisateur confirme. */
  onConfirm: () => void;
  /** Appelé quand l'utilisateur annule ou ferme le dialogue. */
  onCancel: () => void;
}

export function DialogConfirmation({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: DialogConfirmationProps) {
  const confirmColor = destructive ? colors.danger : colors.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Backdrop : appui en dehors du panneau annule l'action */}
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Fermer le dialogue"
      />

      {/* Panneau de confirmation */}
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttonRow}>
          <Pressable
            style={[
              styles.buttonCancel,
              { borderColor: colors.border },
            ]}
            onPress={onCancel}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {cancelLabel}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.buttonConfirm,
              { backgroundColor: confirmColor },
            ]}
            onPress={loading ? undefined : onConfirm}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                {confirmLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    width: '88%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonConfirm: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
