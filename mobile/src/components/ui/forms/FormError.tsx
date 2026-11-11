// FormError — message d'erreur de formulaire (Mobile)
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../colors';

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
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
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  text: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
});
