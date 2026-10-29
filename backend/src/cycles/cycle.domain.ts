export const CYCLE_TARGET_INSTALLMENTS = 31;

export type CycleStatus = 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CLOSED';
export type CycleEntryType = 'DEPOSIT' | 'COMMISSION' | 'WITHDRAWAL';

export interface CycleSnapshot {
  status: CycleStatus;
  fixedAmountXaf: bigint;
  installmentCount: number;
  totalCollectedXaf: bigint;
}

export interface CycleLedgerEntry {
  type: CycleEntryType;
  amountXaf: bigint;
}

export interface WithdrawalCalculation {
  commissionToChargeXaf: bigint;
  withdrawalXaf: bigint;
  remainingBalanceXaf: bigint;
}

export class CycleRuleError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'CycleRuleError';
  }
}

export function validateCycleOpening(fixedAmountXaf: bigint): void {
  if (fixedAmountXaf <= 0n) {
    throw new CycleRuleError('MONTANT_FIXE_INVALIDE', 'Le montant fixe doit être supérieur Ã  zéro.');
  }
}

export function recordDeposit(
  cycle: CycleSnapshot,
  amountXaf: bigint,
): Pick<CycleSnapshot, 'installmentCount' | 'totalCollectedXaf' | 'status'> {
  if (cycle.status !== 'ACTIVE') {
    throw new CycleRuleError('CYCLE_NON_ACTIF', 'Le cycle nâ€™accepte pas de versement dans cet état.');
  }
  if (amountXaf <= 0n || amountXaf !== cycle.fixedAmountXaf) {
    throw new CycleRuleError('MONTANT_VERSEMENT_INVALIDE', 'Le versement doit égaler le montant fixe du cycle.');
  }
  if (cycle.installmentCount < 0 || cycle.installmentCount >= CYCLE_TARGET_INSTALLMENTS) {
    throw new CycleRuleError('OBJECTIF_CYCLE_ATTEINT', 'Le nombre cible de versements est déjÃ  atteint.');
  }

  const installmentCount = cycle.installmentCount + 1;
  return {
    installmentCount,
    totalCollectedXaf: cycle.totalCollectedXaf + amountXaf,
    status: installmentCount === CYCLE_TARGET_INSTALLMENTS ? 'COMPLETED' : 'ACTIVE',
  };
}

export function suspendCycle(cycle: CycleSnapshot): CycleStatus {
  if (cycle.status !== 'ACTIVE') {
    throw new CycleRuleError('TRANSITION_CYCLE_INVALIDE', 'Seul un cycle actif peut être suspendu.');
  }
  return 'SUSPENDED';
}

export function resumeCycle(cycle: CycleSnapshot): CycleStatus {
  if (cycle.status !== 'SUSPENDED') {
    throw new CycleRuleError('TRANSITION_CYCLE_INVALIDE', 'Seul un cycle suspendu peut être repris.');
  }
  return 'ACTIVE';
}

export function calculateAvailableBalance(entries: readonly CycleLedgerEntry[]): bigint {
  return entries.reduce((balance, entry) => {
    if (entry.amountXaf <= 0n) {
      throw new CycleRuleError('ECRITURE_INVALIDE', 'Une écriture financière doit avoir un montant positif.');
    }
    return balance + (entry.type === 'DEPOSIT' ? entry.amountXaf : -entry.amountXaf);
  }, 0n);
}

export function calculateWithdrawal(
  cycle: CycleSnapshot,
  availableBalanceXaf: bigint,
  commissionAlreadyPaid: boolean,
  requestedAmountXaf: bigint,
  closesCycle = false,
): WithdrawalCalculation {
  if (cycle.status === 'CLOSED') {
    throw new CycleRuleError('CYCLE_CLOTURE', 'Un cycle clôturé ne peut plus faire lâ€™objet dâ€™un retrait.');
  }
  if (requestedAmountXaf <= 0n) {
    throw new CycleRuleError('MONTANT_RETRAIT_INVALIDE', 'Le montant du retrait doit être supérieur Ã  zéro.');
  }
  if (availableBalanceXaf < 0n) {
    throw new CycleRuleError('SOLDE_INCOHERENT', 'Le solde du cycle ne peut pas être négatif.');
  }

  const commissionToChargeXaf = commissionAlreadyPaid ? 0n : cycle.fixedAmountXaf;
  if (requestedAmountXaf + commissionToChargeXaf > availableBalanceXaf) {
    throw new CycleRuleError(
      'SOLDE_INSUFFISANT',
      'Le solde ne couvre pas le retrait et la commission éventuellement due.',
    );
  }
  if (closesCycle && requestedAmountXaf + commissionToChargeXaf !== availableBalanceXaf) {
    throw new CycleRuleError(
      'RETRAIT_TOTAL_INCOMPLET',
      'Un retrait clôturant le cycle doit retirer tout le solde net disponible.',
    );
  }

  return {
    commissionToChargeXaf,
    withdrawalXaf: requestedAmountXaf,
    remainingBalanceXaf: availableBalanceXaf - commissionToChargeXaf - requestedAmountXaf,
  };
}
