// FormActions — barre d'actions (Annuler / Enregistrer) (Mobile)
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button';
import { colors, space } from '../colors';

interface FormActionsProps {
  cancelLabel?: string;
  onCancel: () => void;
  submitLabel: string;
  onSubmit: () => void;
  submitting?: boolean;
  cancelVariant?: 'secondary' | 'ghost';
  submitVariant?: 'primary' | 'danger';
}

export function FormActions({
  cancelLabel = 'Annuler',
  onCancel,
  submitLabel = 'Enregistrer',
  onSubmit,
  submitting = false,
  cancelVariant = 'secondary',
  submitVariant = 'primary',
}: FormActionsProps) {
  return (
    <View style={styles.actions}>
      <Button
        label={cancelLabel}
        variant={cancelVariant}
        onPress={onCancel}
        disabled={submitting}
      />
      <Button
        label={submitting ? 'Enregistrement…' : submitLabel}
        variant={submitVariant}
        onPress={onSubmit}
        disabled={submitting}
        loading={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
});
