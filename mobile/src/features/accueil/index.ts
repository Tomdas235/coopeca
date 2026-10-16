import type { MontantXAF } from '../../types';

export interface IndicateursAccueil {
  clients: number;
  dossiers: number;
  collectes: number;
  montantCollecte: MontantXAF;
}

export const indicateursDemonstration: IndicateursAccueil = {
  clients: 128,
  dossiers: 94,
  collectes: 8,
  montantCollecte: 425000,
};
