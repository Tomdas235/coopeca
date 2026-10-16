import { ScreenPlaceholder } from '../../src/components/ScreenPlaceholder';

/**
 * Clôture journalière — squelette uniquement.
 *
 * Règles à l'implémentation : clôture quotidienne obligatoire même hors
 * ligne, réouverture réservée à un superviseur autorisé avec motif et
 * journal d'audit (AGENT.md §3 et §4).
 */
export default function ClotureScreen() {
  return (
    <ScreenPlaceholder
      titre="Clôture"
      description="Clôture journalière non implémentée (squelette). Clôture hors ligne et réouverture supervisée : à venir après validation du modèle de données."
    />
  );
}
