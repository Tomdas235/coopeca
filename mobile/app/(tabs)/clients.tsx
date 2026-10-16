import { ScreenPlaceholder } from '../../src/components/ScreenPlaceholder';

/**
 * Clients — squelette uniquement.
 *
 * La création hors ligne (statut PROVISOIRE) et le contrôle des doublons
 * ne sont pas implémentés (docs/DECISIONS_METIER.md, règles 2 et 4).
 */
export default function ClientsScreen() {
  return (
    <ScreenPlaceholder
      titre="Clients"
      description="Gestion des clients non implémentée (squelette). Création hors ligne et statut PROVISOIRE : à venir après validation du modèle de données."
    />
  );
}
