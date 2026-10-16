import { StyleSheet, Text, View } from 'react-native';

interface ScreenPlaceholderProps {
  titre: string;
  description: string;
}

/**
 * Cartouche standard des écrans squelette COOPECA.
 *
 * Elle garantit qu'aucun écran ne présente une fonctionnalité comme
 * disponible tant qu'elle n'est pas implémentée et testée : chaque écran
 * indique explicitement son état « squelette ».
 */
export function ScreenPlaceholder({ titre, description }: ScreenPlaceholderProps) {
  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>{titre}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.etat}>Squelette COOPECA — fonctionnalité non implémentée</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  etat: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#8A5A00',
  },
});
