/**
 * Compare keeping an auto loan with refinancing it.
 *
 * Refinancing any fixed-rate installment loan is the same two-loan comparison,
 * so this reuses the mortgage refinance engine instead of duplicating the
 * amortization and break-even logic. Auto-specific parts: a prepayment penalty
 * on the current loan, and refinance costs that are either paid in cash or
 * added to the new loan (the new lender pays off the balance plus the penalty).
 */

import { calculateMortgageRefinance } from './mortgage-refinance.js';

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export function calculateAutoLoanRefinance({
  currentBalance,
  currentRate,
  currentTermMonths,
  newRate,
  newTermMonths,
  fees = 0,
  prepaymentPenalty = 0,
  financeCosts = false,
  plannedKeepMonths = null
}) {
  nonNegative('fees', fees);
  nonNegative('prepaymentPenalty', prepaymentPenalty);
  const refinanceCosts = fees + prepaymentPenalty;
  const comparison = calculateMortgageRefinance({
    currentBalance,
    currentAPR: currentRate,
    currentTermMonths,
    newAPR: newRate,
    newTermMonths,
    closingCosts: refinanceCosts,
    financeClosingCosts: financeCosts,
    plannedStayMonths: plannedKeepMonths
  });

  return {
    refinanceCosts,
    cashCosts: financeCosts ? 0 : refinanceCosts,
    newPrincipal: comparison.newPrincipal,
    currentPayment: comparison.currentMonthlyPayment,
    newPayment: comparison.newMonthlyPayment,
    monthlySavings: comparison.monthlySavings,
    currentTotalInterest: comparison.currentTotalInterest,
    newTotalInterest: comparison.newTotalInterest,
    currentTotalCost: comparison.currentTotalRepayment,
    newTotalCost: comparison.refinanceTotalCost,
    lifetimeSavings: comparison.netLifetimeSavings,
    // Cash costs ÷ monthly savings; null when the payment does not fall.
    simpleBreakEvenMonths: Number.isFinite(comparison.breakEvenMonths) ? comparison.breakEvenMonths : null,
    // Months in which refinancing is ahead once the balance still owed is counted.
    aheadWindow: comparison.aheadWindow,
    extraMonths: newTermMonths - currentTermMonths,
    netSavingsAt: comparison.netSavingsAt,
    positionAt: comparison.positionAt,
    horizonMonths: comparison.horizonMonths
  };
}
