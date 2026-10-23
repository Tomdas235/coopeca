import {
  calculateAvailableBalance,
  calculateWithdrawal,
  CycleRuleError,
  CycleSnapshot,
  recordDeposit,
  resumeCycle,
  suspendCycle,
  validateCycleOpening,
} from './cycle.domain';

const activeCycle = (overrides: Partial<CycleSnapshot> = {}): CycleSnapshot => ({
  status: 'ACTIVE',
  fixedAmountXaf: 5_000n,
  installmentCount: 0,
  totalCollectedXaf: 0n,
  ...overrides,
});

describe('cycle domain rules', () => {
  it('requires a positive fixed amount when opening a cycle', () => {
    expect(() => validateCycleOpening(5_000n)).not.toThrow();
    expect(() => validateCycleOpening(0n)).toThrow(CycleRuleError);
  });

  it('counts 31 accepted deposits, including repeated same-day deposits', () => {
    let cycle = activeCycle();
    const depositsDeclaredOnSameDay = Array.from(
      { length: 31 },
      () => new Date('2026-10-22T09:00:00.000Z'),
    );
    for (const _sameDayDeposit of depositsDeclaredOnSameDay) {
      const next = recordDeposit(cycle, 5_000n);
      cycle = { ...cycle, ...next };
    }

    expect(cycle.installmentCount).toBe(31);
    expect(cycle.totalCollectedXaf).toBe(155_000n);
    expect(cycle.status).toBe('COMPLETED');
    expect(new Set(depositsDeclaredOnSameDay.map((date) => date.toISOString().slice(0, 10))).size).toBe(1);
    expect(recordDeposit(activeCycle({ installmentCount: 30 }), 5_000n).installmentCount).toBe(31);
  });

  it.each([4_999n, 5_001n])('rejects a deposit of %s without changing the cycle', (amount) => {
    const cycle = activeCycle({ installmentCount: 7, totalCollectedXaf: 35_000n });
    expect(() => recordDeposit(cycle, amount)).toThrow(CycleRuleError);
    expect(cycle.installmentCount).toBe(7);
    expect(cycle.totalCollectedXaf).toBe(35_000n);
  });

  it('blocks deposits while suspended and preserves progress on resume', () => {
    const before = activeCycle({ installmentCount: 8, totalCollectedXaf: 40_000n });
    expect(suspendCycle(before)).toBe('SUSPENDED');
    const suspended = { ...before, status: suspendCycle(before) };
    expect(() => recordDeposit(suspended, 5_000n)).toThrow(CycleRuleError);
    expect(resumeCycle(suspended)).toBe('ACTIVE');
    expect(suspended.installmentCount).toBe(8);
    expect(suspended.totalCollectedXaf).toBe(40_000n);
  });

  it('does not create a commission for suspension; commission is only part of withdrawal calculation', () => {
    const cycle = activeCycle({ installmentCount: 4, totalCollectedXaf: 20_000n });
    suspendCycle(cycle);
    const balance = calculateAvailableBalance([
      { type: 'DEPOSIT', amountXaf: 20_000n },
    ]);
    expect(balance).toBe(20_000n);
  });

  it('charges exactly one fixed installment on a first partial withdrawal before completion', () => {
    const result = calculateWithdrawal(activeCycle({ installmentCount: 3 }), 15_000n, false, 4_000n);
    expect(result).toEqual({
      commissionToChargeXaf: 5_000n,
      withdrawalXaf: 4_000n,
      remainingBalanceXaf: 6_000n,
    });
  });

  it('does not charge a second commission on subsequent withdrawals', () => {
    const result = calculateWithdrawal(activeCycle({ installmentCount: 8 }), 26_000n, true, 10_000n);
    expect(result.commissionToChargeXaf).toBe(0n);
    expect(result.remainingBalanceXaf).toBe(16_000n);
  });

  it('allows successive partial withdrawals after the 31st deposit without another commission', () => {
    const completed = activeCycle({ status: 'COMPLETED', installmentCount: 31, totalCollectedXaf: 155_000n });
    const first = calculateWithdrawal(completed, 150_000n, true, 40_000n);
    const second = calculateWithdrawal(completed, first.remainingBalanceXaf, true, 110_000n);
    expect(first.remainingBalanceXaf).toBe(110_000n);
    expect(second.remainingBalanceXaf).toBe(0n);
    expect(second.commissionToChargeXaf).toBe(0n);
  });

  it('rejects withdrawal above balance and withdrawal that cannot cover due commission', () => {
    const cycle = activeCycle({ installmentCount: 1, totalCollectedXaf: 5_000n });
    expect(() => calculateWithdrawal(cycle, 5_000n, true, 5_001n)).toThrow(CycleRuleError);
    expect(() => calculateWithdrawal(cycle, 5_000n, false, 1n)).toThrow(CycleRuleError);
  });

  it('requires a full net-balance withdrawal when the request closes the cycle', () => {
    const cycle = activeCycle({ installmentCount: 2, totalCollectedXaf: 10_000n });
    expect(() => calculateWithdrawal(cycle, 10_000n, false, 4_999n, true)).toThrow(CycleRuleError);
    expect(calculateWithdrawal(cycle, 10_000n, false, 5_000n, true).remainingBalanceXaf).toBe(0n);
  });

  it('allows a withdrawal request to close early and forbids later withdrawals on a closed cycle', () => {
    const result = calculateWithdrawal(activeCycle({ installmentCount: 2 }), 10_000n, false, 5_000n);
    expect(result.remainingBalanceXaf).toBe(0n);
    const closed = activeCycle({ status: 'CLOSED', installmentCount: 2, totalCollectedXaf: 10_000n });
    expect(() => calculateWithdrawal(closed, 0n, true, 1n)).toThrow(CycleRuleError);
  });
});