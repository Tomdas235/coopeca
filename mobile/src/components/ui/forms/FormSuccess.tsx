// FormSuccess — message de confirmation de succès (Mobile)
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../colors';

interface FormSuccessProps {
  message: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space.sm,
    marginBottom: space.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
  },
  text: {
    color: colors.success,
    fontSize: 13,
    textAlign: 'center',
  },
});
