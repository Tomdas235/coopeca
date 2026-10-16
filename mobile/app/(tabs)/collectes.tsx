import { FeatureScreen } from '../../src/components/FeatureScreen';

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
    <FeatureScreen
      title="Collectes"
      description="Suivez les collectes journalières rattachées à un client et à un dossier."
      nextStep="La saisie, l’enregistrement local et la génération de reçu ne sont pas encore disponibles. Les montants seront conservés en entiers XAF."
    />
  );
}
