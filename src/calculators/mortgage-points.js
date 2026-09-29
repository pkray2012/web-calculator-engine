/**
 * Compare a fixed-rate mortgage without discount points with the same loan
 * at the lower rate a lender quotes for paying points at closing.
 *
 * Buying points is a two-loan comparison with an upfront cost, so this reuses
 * the refinance comparison engine (same principal and term, points cost paid
 * in cash) instead of duplicating amortization and break-even logic. With the
 * same principal and term, "paid so far + balance owed" differs only by the
 * interest paid, so the true break-even is the first month in which cumulative
 * interest saved exceeds the cost of the points.
 */

import { calculateMortgageRefinance } from './mortgage-refinance.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

export function calculateMortgagePoints({ loanAmount, termMonths, baseRate, pointsRate, points, plannedStayMonths = null }) {
  finite('loanAmount', loanAmount);
  finite('baseRate', baseRate);
  finite('pointsRate', pointsRate);
  finite('points', points);
  if (loanAmount <= 0) throw new RangeError('loanAmount must be greater than 0');
  if (points < 0) throw new RangeError('points cannot be negative');
  if (pointsRate < 0) throw new RangeError('pointsRate cannot be negative');
  if (pointsRate > baseRate) throw new RangeError('pointsRate cannot exceed baseRate');

  const pointsCost = loanAmount * points / 100;
  const comparison = calculateMortgageRefinance({
    currentBalance: loanAmount,
    currentAPR: baseRate,
    currentTermMonths: termMonths,
    newAPR: pointsRate,
    newTermMonths: termMonths,
    closingCosts: pointsCost,
    financeClosingCosts: false,
    plannedStayMonths
  });

  const monthlySavings = comparison.monthlySavings;
  return {
    pointsCost,
    rateReductionPerPoint: points > 0 ? (baseRate - pointsRate) / points : null,
    basePayment: comparison.currentMonthlyPayment,
    pointsPayment: comparison.newMonthlyPayment,
    monthlySavings,
    baseTotalInterest: comparison.currentTotalInterest,
    pointsTotalInterest: comparison.newTotalInterest,
    // Points cost ÷ monthly payment savings: the rule of thumb most calculators show.
    simpleBreakEvenMonths: monthlySavings > 0 ? pointsCost / monthlySavings : null,
    // First month the points option has cost less in total, counting the balance owed.
    breakEvenMonth: comparison.aheadWindow ? comparison.aheadWindow.fromMonth : null,
    lifetimeSavings: comparison.netLifetimeSavings,
    netSavingsAt: comparison.netSavingsAt,
    positionAt: comparison.positionAt,
    termMonths
  };
}
