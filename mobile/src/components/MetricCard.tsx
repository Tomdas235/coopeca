import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

interface MetricCardProps {
  label: string;
  value: string;
  note?: string;
}

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  note: {
    color: colors.muted,
    fontSize: 11,
  },
});
