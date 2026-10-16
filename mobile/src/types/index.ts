/**
 * Types partagés COOPECA.
 *
 * Règle non négociable : tout montant financier est un nombre ENTIER en
 * XAF, jamais un nombre flottant (AGENT.md §4). Ce type est volontairement
 * un alias d'entier ; la construction/les garde-fous vivent dans
 * src/utils/montants.ts.
 *
 * Les types métier (dossier, collecte, remise, clôture, états de
 * synchronisation/métier/impression) ne sont PAS définis ici : ils
 * attendent les validations ouvertes de docs/DECISIONS_METIER.md §4 et
 * docs/IMPACTS_SCHEMA_SQL.md §8.
 */
export type MontantXAF = number;
