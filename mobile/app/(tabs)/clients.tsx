import { FeatureScreen } from '../../src/components/FeatureScreen';

/**
 * Clients — squelette uniquement.
 *
 * La création hors ligne (statut PROVISOIRE) et le contrôle des doublons
 * ne sont pas implémentés (docs/DECISIONS_METIER.md, règles 2 et 4).
 */
export default function ClientsScreen() {
  return (
    <FeatureScreen
      title="Clients"
      description="Retrouvez les informations des clients et leur statut."
      nextStep="La recherche, la consultation et la création hors ligne avec statut PROVISOIRE seront développées après validation du modèle."
    />
  );
}
