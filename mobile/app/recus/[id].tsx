import { useLocalSearchParams } from 'expo-router';
import { ScreenPlaceholder } from '../../src/components/ScreenPlaceholder';

/**
 * Détail d'un reçu numérique — squelette uniquement.
 *
 * Affiche l'identifiant transmis par la route dynamique recus/[id]
 * (navigation vérifiable, aucune donnée métier). L'impression Bluetooth
 * et le numéro officiel attribué à l'acceptation ne sont pas implémentés
 * (docs/REÇUS_ET_DATE_METIER.md).
 */
export default function RecuDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      titre={`Reçu ${id ?? ''}`.trim()}
      description="Reçu numérique non implémenté (squelette). Un reçu hors ligne devra être clairement identifié comme en attente de synchronisation."
    />
  );
}
