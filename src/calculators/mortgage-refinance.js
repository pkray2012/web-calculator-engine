/**
 * Compare a remaining fixed-rate mortgage with a proposed rate-and-term refinance.
 * Uses the shared fixed-rate loan engine so payment and interest semantics stay consistent.
 */

import { calculateLoan } from './loan-payment.js';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  finite(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

function costThroughMonth(schedule, principal, months) {
  const rows = schedule.slice(0, months);
  return {
    payments: rows.reduce((sum, row) => sum + row.payment, 0),
    balance: rows.length ? rows.at(-1).balance : principal
  };
}

/**
 * Cumulative cost of each option if the home is sold (or the loan paid off)
 * at the end of month m: payments made through m plus the balance still owed,
 * for m = 1..horizon. Built from the same schedules as every other output.
 */
function cumulativePositions(schedule, principal, horizon) {
  const positions = new Array(horizon);
  let paid = 0;
  let balance = principal;
  for (let month = 1; month <= horizon; month += 1) {
    const row = schedule[month - 1];
    if (row) {
      paid += row.payment;
      balance = row.balance;
    }
    positions[month - 1] = { paid, balance, cost: paid + balance };
  }
  return positions;
}

export function calculateMortgageRefinance({
  currentBalance,
  currentAPR,
  currentTermMonths,
  newAPR,
  newTermMonths,
  closingCosts = 0,
  financeClosingCosts = false,
  plannedStayMonths = null
}) {
  positive('currentBalance', currentBalance);
  nonNegative('currentAPR', currentAPR);
  nonNegative('newAPR', newAPR);
  nonNegative('closingCosts', closingCosts);
  if (!Number.isInteger(currentTermMonths) || currentTermMonths <= 0) throw new RangeError('currentTermMonths must be a positive integer');
  if (!Number.isInteger(newTermMonths) || newTermMonths <= 0) throw new RangeError('newTermMonths must be a positive integer');
  if (plannedStayMonths !== null && (!Number.isInteger(plannedStayMonths) || plannedStayMonths <= 0)) {
    throw new RangeError('plannedStayMonths must be a positive integer or null');
  }

  const currentLoan = calculateLoan({ principal: currentBalance, annualRate: currentAPR, termMonths: currentTermMonths });
  const newPrincipal = financeClosingCosts ? currentBalance + closingCosts : currentBalance;
  const newLoan = calculateLoan({ principal: newPrincipal, annualRate: newAPR, termMonths: newTermMonths });

  const monthlySavings = currentLoan.monthlyPayment - newLoan.monthlyPayment;
  const breakEvenMonths = monthlySavings > 0 ? closingCosts / monthlySavings : Infinity;
  const refinanceTotalCost = newLoan.totalRepayment + (financeClosingCosts ? 0 : closingCosts);
  const netLifetimeSavings = currentLoan.totalRepayment - refinanceTotalCost;
  const payoffMonthsChange = newLoan.scheduledPayments - currentLoan.scheduledPayments;

  // Net savings of refinancing if you sell or pay off at the end of month m.
  const horizon = Math.max(currentTermMonths, newTermMonths);
  const upfront = financeClosingCosts ? 0 : closingCosts;
  const currentPositions = cumulativePositions(currentLoan.schedule, currentBalance, horizon);
  const refinancePositions = cumulativePositions(newLoan.schedule, newPrincipal, horizon);
  const netByMonth = currentPositions.map((position, index) => position.cost - (refinancePositions[index].cost + upfront));
  const monthIndex = (month) => {
    if (!Number.isInteger(month) || month < 1) throw new RangeError('month must be a positive integer');
    return Math.min(month, horizon) - 1;
  };
  const netSavingsAt = (month) => netByMonth[monthIndex(month)];
  /** Both options if you sell or pay off at the end of month: payments made, balance owed, total cost. */
  const positionAt = (month) => {
    const index = monthIndex(month);
    const current = currentPositions[index];
    const refinance = refinancePositions[index];
    return {
      month: index + 1,
      current: { paid: current.paid, balance: current.balance, cost: current.cost },
      refinance: { paid: refinance.paid + upfront, balance: refinance.balance, cost: refinance.cost + upfront },
      netSavings: netByMonth[index]
    };
  };

  // "True" break-even: the first month refinancing is ahead once the balance
  // still owed is counted. untilMonth is the last month it is ahead when it
  // later falls behind (e.g. a term reset), or null if it stays ahead.
  const firstAhead = netByMonth.findIndex((value) => value > 0);
  let aheadWindow = null;
  if (firstAhead !== -1) {
    let lastAhead = horizon - 1;
    while (netByMonth[lastAhead] <= 0) lastAhead -= 1;
    aheadWindow = {
      fromMonth: firstAhead + 1,
      untilMonth: lastAhead === horizon - 1 ? null : lastAhead + 1
    };
  }

  let stayPeriod = null;
  if (plannedStayMonths !== null) {
    // Selling or paying off at the planned stay means the remaining balance is owed too.
    // Comparing payments alone overstates savings when the refinance resets the term or
    // finances closing costs, because the new loan's balance at that point is higher.
    const current = costThroughMonth(currentLoan.schedule, currentBalance, plannedStayMonths);
    const refinance = costThroughMonth(newLoan.schedule, newPrincipal, plannedStayMonths);
    const upfrontCost = financeClosingCosts ? 0 : closingCosts;
    const currentCost = current.payments + current.balance;
    const refinanceCost = refinance.payments + upfrontCost + refinance.balance;
    const netSavings = currentCost - refinanceCost;
    stayPeriod = {
      months: plannedStayMonths,
      currentPayments: current.payments,
      refinancePayments: refinance.payments + upfrontCost,
      currentBalanceAtStay: current.balance,
      refinanceBalanceAtStay: refinance.balance,
      currentCost,
      refinanceCost,
      netSavings,
      reachesBreakEven: netSavings > 0
    };
  }

  return {
    currentMonthlyPayment: currentLoan.monthlyPayment,
    currentTotalInterest: currentLoan.totalInterest,
    currentTotalRepayment: currentLoan.totalRepayment,
    newPrincipal,
    newMonthlyPayment: newLoan.monthlyPayment,
    newTotalInterest: newLoan.totalInterest,
    newTotalRepayment: newLoan.totalRepayment,
    monthlySavings,
    annualPaymentSavings: monthlySavings * 12,
    breakEvenMonths,
    aheadWindow,
    netSavingsAt,
    positionAt,
    horizonMonths: horizon,
    refinanceTotalCost,
    netLifetimeSavings,
    payoffMonthsChange,
    termResetWarning: newTermMonths > currentTermMonths,
    stayPeriod
  };
}
