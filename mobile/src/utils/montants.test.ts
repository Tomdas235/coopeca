import { formatMontantXAF, sommeMontants } from './montants';

describe('montants (règle COOPECA : entiers XAF, jamais de flottants)', () => {
  describe('formatMontantXAF', () => {
    it('formatte les milliers avec une espace', () => {
      expect(formatMontantXAF(1500)).toBe('1 500 XAF');
      expect(formatMontantXAF(1234567)).toBe('1 234 567 XAF');
    });

    it('formatte zéro et les montants négatifs', () => {
      expect(formatMontantXAF(0)).toBe('0 XAF');
      expect(formatMontantXAF(-2500)).toBe('-2 500 XAF');
    });

    it('rejette explicitement tout montant non entier', () => {
      expect(() => formatMontantXAF(1.5)).toThrow(TypeError);
      expect(() => formatMontantXAF(Number.NaN)).toThrow(TypeError);
      expect(() => formatMontantXAF(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    });
  });

  describe('sommeMontants', () => {
    it('additionne des montants entiers', () => {
      expect(sommeMontants(100, 250, 50)).toBe(400);
      expect(sommeMontants()).toBe(0);
    });

    it("refuse d'additionner un montant non entier", () => {
      expect(() => sommeMontants(100, 0.5)).toThrow(TypeError);
    });
  });
});
