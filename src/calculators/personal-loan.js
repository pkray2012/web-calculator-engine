/**
 * US personal-loan domain calculations built on the generic fixed-rate loan engine.
 * Origination fees are modeled separately from amortization so the UI can show
 * both amount received and total repayment without duplicating loan math.
 */

import { calculateLoan } from './loan-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/**
 * Solve the annualized rate implied by net proceeds and the scheduled monthly
 * payment stream. This is an estimate for comparison, not a Regulation Z APR
 * disclosure; lender-specific finance charges and payment timing can differ.
 */
function effectiveAPR({ netProceeds, schedule }) {
  if (netProceeds <= 0) throw new RangeError('netProceeds must be greater than 0');
  if (schedule.length === 0) throw new RangeError('schedule must contain payments');

  const presentValue = (monthlyRate) => schedule.reduce(
    (total, row) => total + row.payment / Math.pow(1 + monthlyRate, row.month),
    0
  );

  if (Math.abs(presentValue(0) - netProceeds) < 1e-10) return 0;

  let low = 0;
  let high = 0.01;
  while (presentValue(high) > netProceeds && high < 100) high *= 2;
  if (presentValue(high) > netProceeds) throw new RangeError('effective APR could not be solved');

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const mid = (low + high) / 2;
    if (presentValue(mid) > netProceeds) low = mid;
    else high = mid;
  }

  return ((low + high) / 2) * 12 * 100;
}

export function calculatePersonalLoan({
  loanAmount,
  originationFeeRate = 0,
  annualRate,
  termMonths,
  extraMonthly = 0
}) {
  finite('loanAmount', loanAmount);
  if (loanAmount <= 0) throw new RangeError('loanAmount must be greater than 0');
  nonNegative('originationFeeRate', originationFeeRate);

  const originationFee = loanAmount * (originationFeeRate / 100);
  const amountReceived = loanAmount - originationFee;
  if (amountReceived <= 0) {
    throw new RangeError('originationFeeRate leaves no amount received');
  }

  const loan = calculateLoan({
    principal: loanAmount,
    annualRate,
    termMonths,
    extraMonthly
  });

  const baseAPR = effectiveAPR({ netProceeds: amountReceived, schedule: loan.schedule });

  // The fee is withheld from the proceeds, so it is already inside the
  // principal being repaid: total repaid is the payment stream alone, and the
  // cost of borrowing is what is repaid beyond the cash received.
  return {
    loanAmount,
    originationFeeRate,
    originationFee,
    amountReceived,
    effectiveAPR: baseAPR,
    totalInterest: loan.totalInterest,
    totalCost: loan.totalRepayment,
    costOfBorrowing: loan.totalRepayment - amountReceived,
    ...loan,
    accelerated: {
      ...loan.accelerated,
      // Paying early does not refund a withheld fee, so its effective rate rises.
      effectiveAPR: extraMonthly > 0
        ? effectiveAPR({ netProceeds: amountReceived, schedule: loan.accelerated.schedule })
        : baseAPR,
      costOfBorrowing: loan.accelerated.totalRepayment - amountReceived
    }
  };
}
