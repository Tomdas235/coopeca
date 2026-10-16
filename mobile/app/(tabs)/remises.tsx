import { FeatureScreen } from '../../src/components/FeatureScreen';

/**
 * Remises — squelette uniquement.
 *
 * Règle non négociable à l'implémentation : la déclaration de remise par
 * l'agent n'est jamais une remise confirmée par le caissier ; les deux
 * confirmations restent distinctes (AGENT.md §4, DECISIONS_METIER.md r4).
 */
export default function RemisesScreen() {
  return (
    <FeatureScreen
      title="Reversements"
      description="Suivez les remises de fonds déclarées par l’agent."
      nextStep="La déclaration par l’agent et la confirmation de réception par le caissier resteront deux étapes distinctes. Aucun reversement n’est enregistré dans cette version."
    />
  );
}
