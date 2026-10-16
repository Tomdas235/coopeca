import { MontantXAF } from '../types';

/**
 * Utilitaires de montants financiers COOPECA.
 *
 * Règle non négociable : les montants sont des nombres ENTIERS en XAF,
 * jamais des flottants. Chaque fonction ci-dessous refuse explicitement
 * toute valeur non entière plutôt que d'arrondir silencieusement.
 */

function exigerEntier(montant: number, contexte: string): void {
  if (!Number.isInteger(montant)) {
    throw new TypeError(
      `${contexte} : montant non entier (${montant}). Les montants COOPECA sont des entiers XAF.`,
    );
  }
}

/** Formate un montant entier XAF : 1500 -> « 1 500 XAF ». */
export function formatMontantXAF(montant: MontantXAF): string {
  exigerEntier(montant, 'formatMontantXAF');
  const signe = montant < 0 ? '-' : '';
  const chiffres = Math.abs(montant)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${signe}${chiffres} XAF`;
}

/** Somme de montants entiers XAF ; refuse tout flottant en entrée. */
export function sommeMontants(...montants: MontantXAF[]): MontantXAF {
  let total = 0;
  for (const montant of montants) {
    exigerEntier(montant, 'sommeMontants');
    total += montant;
  }
  return total;
}
