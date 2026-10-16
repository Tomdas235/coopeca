import { ScreenPlaceholder } from '../../src/components/ScreenPlaceholder';

/**
 * Remises — squelette uniquement.
 *
 * Règle non négociable à l'implémentation : la déclaration de remise par
 * l'agent n'est jamais une remise confirmée par le caissier ; les deux
 * confirmations restent distinctes (AGENT.md §4, DECISIONS_METIER.md r4).
 */
export default function RemisesScreen() {
  return (
    <ScreenPlaceholder
      titre="Remises"
      description="Déclaration de remise par l'agent non implémentée (squelette). La réception caisse est une confirmation distincte, jamais active à ce stade."
    />
  );
}
