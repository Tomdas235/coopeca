import { ScreenPlaceholder } from '../../src/components/ScreenPlaceholder';

/**
 * Collectes — squelette uniquement.
 *
 * Règles à respecter à l'implémentation : enregistrement hors ligne,
 * conservation de la date de collecte déclarée sur l'appareil,
 * montants en entiers XAF, rattachement à un seul dossier
 * (docs/IMPACTS_SCHEMA_SQL.md, principe validé).
 */
export default function CollectesScreen() {
  return (
    <ScreenPlaceholder
      titre="Collectes"
      description="Collectes journalières non implémentées (squelette). Enregistrement hors ligne et date déclarée : à venir après validation du modèle de données."
    />
  );
}
