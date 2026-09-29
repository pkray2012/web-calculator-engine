/**
 * Compare keeping student loans with refinancing them into one private loan.
 *
 * The money comparison is the same two-loan comparison as any refinance, so
 * this reuses the mortgage refinance engine. The student-loan specifics are
 * a same-term comparison that isolates the rate change, and the new rate
 * across common terms. What federal borrowers give up is not a number and is
 * handled in the page copy and results, not here.
 */

import { calculateMortgageRefinance } from './mortgage-refinance.js';

/** Common private refinance terms, in months. */
export const REFINANCE_TERMS = Object.freeze([60, 84, 120, 180, 240]);

function compare(input, newTermMonths) {
  const result = calculateMortgageRefinance({
    currentBalance: input.balance,
    currentAPR: input.currentRate,
    currentTermMonths: input.currentTermMonths,
    newAPR: input.newRate,
    newTermMonths,
    closingCosts: input.fees,
    financeClosingCosts: false
  });
  return {
    termMonths: newTermMonths,
    payment: result.newMonthlyPayment,
    totalInterest: result.newTotalInterest,
    totalCost: result.refinanceTotalCost,
    lifetimeSavings: result.netLifetimeSavings
  };
}

export function calculateStudentLoanRefinance({ balance, currentRate, currentTermMonths, newRate, newTermMonths, fees = 0 }) {
  if (!Number.isFinite(fees) || fees < 0) throw new RangeError('fees must be a non-negative number');
  const input = { balance, currentRate, currentTermMonths, newRate, fees };
  const main = calculateMortgageRefinance({
    currentBalance: balance,
    currentAPR: currentRate,
    currentTermMonths,
    newAPR: newRate,
    newTermMonths,
    closingCosts: fees,
    financeClosingCosts: false
  });
  const terms = [...new Set([...REFINANCE_TERMS, currentTermMonths, newTermMonths])].sort((a, b) => a - b);

  return {
    current: { payment: main.currentMonthlyPayment, totalInterest: main.currentTotalInterest, totalCost: main.currentTotalRepayment, months: currentTermMonths },
    refinance: { payment: main.newMonthlyPayment, totalInterest: main.newTotalInterest, totalCost: main.refinanceTotalCost, months: newTermMonths },
    monthlySavings: main.monthlySavings,
    lifetimeSavings: main.netLifetimeSavings,
    extraMonths: newTermMonths - currentTermMonths,
    // The new rate over the time you already have left: the rate change on its own.
    sameTerm: compare(input, currentTermMonths),
    options: terms.map((term) => ({ ...compare(input, term), current: term === currentTermMonths, selected: term === newTermMonths }))
  };
}
