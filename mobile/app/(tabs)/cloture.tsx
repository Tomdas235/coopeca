import { FeatureScreen } from '../../src/components/FeatureScreen';

/**
 * Clôture journalière — squelette uniquement.
 *
 * Règles à l'implémentation : clôture quotidienne obligatoire même hors
 * ligne, réouverture réservée à un superviseur autorisé avec motif et
 * journal d'audit (AGENT.md §3 et §4).
 */
export default function ClotureScreen() {
  return (
    <FeatureScreen
      title="Clôture journalière"
      description="Préparez le récapitulatif de fin de journée de l’agent."
      nextStep="Le calcul et l’enregistrement de la clôture ne sont pas encore disponibles. Une clôture hors ligne devra rester identifiable comme non synchronisée."
    />
  );
}
