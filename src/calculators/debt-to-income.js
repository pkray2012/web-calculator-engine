/**
 * Debt-to-income (DTI) ratios, as the CFPB defines them: monthly debt payments
 * divided by gross monthly income. Reports the housing-only (front-end) and
 * total (back-end) ratios, the room left for a new payment under a target
 * total ratio, and the monthly payments to cut to reach it.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export function calculateDebtToIncome({ grossMonthlyIncome, housingPayment = 0, otherDebts = [], targetPercent = 36 }) {
  nonNegative('grossMonthlyIncome', grossMonthlyIncome);
  if (grossMonthlyIncome <= 0) throw new RangeError('grossMonthlyIncome must be greater than 0');
  nonNegative('housingPayment', housingPayment);
  nonNegative('targetPercent', targetPercent);
  for (const debt of otherDebts) nonNegative(debt.label ?? 'debt', debt.amount);

  const otherTotal = otherDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalDebt = housingPayment + otherTotal;
  const targetPayment = grossMonthlyIncome * targetPercent / 100;
  return {
    grossMonthlyIncome,
    housingPayment,
    otherTotal,
    totalDebt,
    frontEndPercent: housingPayment / grossMonthlyIncome * 100,
    backEndPercent: totalDebt / grossMonthlyIncome * 100,
    targetPercent,
    targetPayment,
    roomForNewPayment: Math.max(0, targetPayment - totalDebt),
    reductionNeeded: Math.max(0, totalDebt - targetPayment),
    shares: otherDebts
      .filter((debt) => debt.amount > 0)
      .map((debt) => ({ ...debt, percentOfIncome: debt.amount / grossMonthlyIncome * 100 }))
  };
}
