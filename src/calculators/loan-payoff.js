/**
 * Pay off an existing loan early. Starts from where the loan is today (balance,
 * rate and the payment you make) rather than from the original loan, and adds
 * any mix of a monthly extra, a yearly extra and a one-time lump sum. Can also
 * solve for the monthly extra needed to be debt-free within a target number of
 * months. Interest accrues monthly at the annual rate ÷ 12.
 */

import { monthlyPayment } from './loan-payment.js';

const MAX_MONTHS = 1200;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/**
 * Month-by-month payoff. Extras: extraMonthly every month; extraYearly in
 * months 12, 24, …; lumpSum once in lumpSumMonth. Every extra goes to principal
 * and is capped at what is owed.
 */
export function payoffSchedule({ balance, annualRate, payment, extraMonthly = 0, extraYearly = 0, lumpSum = 0, lumpSumMonth = 1 }) {
  const rate = annualRate / 1200;
  const rows = [];
  let remaining = balance;
  for (let month = 1; remaining > 0.005; month += 1) {
    if (month > MAX_MONTHS) throw new RangeError('payment does not pay off the loan');
    const interest = remaining * rate;
    const scheduled = Math.min(payment, remaining + interest);
    let extra = extraMonthly + (month % 12 === 0 ? extraYearly : 0) + (month === lumpSumMonth ? lumpSum : 0);
    const afterScheduled = remaining + interest - scheduled;
    extra = Math.min(extra, afterScheduled);
    remaining = afterScheduled - extra;
    rows.push({ month, payment: scheduled + extra, extra, interest, principal: scheduled + extra - interest, balance: remaining });
  }
  return rows;
}

function totals(rows) {
  return {
    months: rows.length,
    totalInterest: rows.reduce((sum, row) => sum + row.interest, 0),
    totalPaid: rows.reduce((sum, row) => sum + row.payment, 0),
    totalExtra: rows.reduce((sum, row) => sum + row.extra, 0),
    finalPayment: rows.at(-1)?.payment ?? 0
  };
}

/**
 * Extra monthly amount (on top of the current payment and any yearly or lump
 * sum extras) that pays the loan off within targetMonths. Returns 0 when the
 * plan already does. Without other extras this is the closed-form payment for
 * targetMonths minus the current payment; otherwise it is found by bisection
 * on the monotone payoff time.
 */
export function extraNeededForTarget({ balance, annualRate, payment, extraYearly = 0, lumpSum = 0, lumpSumMonth = 1, targetMonths }) {
  if (!Number.isInteger(targetMonths) || targetMonths <= 0) throw new RangeError('targetMonths must be a positive integer');
  const monthsWith = (extraMonthly) => {
    try {
      return payoffSchedule({ balance, annualRate, payment, extraMonthly, extraYearly, lumpSum, lumpSumMonth }).length;
    } catch {
      return Infinity;
    }
  };
  if (monthsWith(0) <= targetMonths) return 0;
  if (extraYearly === 0 && lumpSum === 0) {
    return Math.max(0, monthlyPayment({ principal: balance, annualRate, termMonths: targetMonths }) - payment);
  }
  let low = 0;
  let high = monthlyPayment({ principal: balance, annualRate, termMonths: targetMonths });
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2;
    if (monthsWith(mid) <= targetMonths) high = mid;
    else low = mid;
  }
  return high;
}

export function calculateLoanPayoff({
  balance,
  annualRate,
  payment,
  extraMonthly = 0,
  extraYearly = 0,
  lumpSum = 0,
  lumpSumMonth = 1,
  targetMonths = null
}) {
  finite('balance', balance);
  if (balance <= 0) throw new RangeError('balance must be greater than 0');
  nonNegative('annualRate', annualRate);
  finite('payment', payment);
  if (payment <= 0) throw new RangeError('payment must be greater than 0');
  nonNegative('extraMonthly', extraMonthly);
  nonNegative('extraYearly', extraYearly);
  nonNegative('lumpSum', lumpSum);
  if (!Number.isInteger(lumpSumMonth) || lumpSumMonth < 1) throw new RangeError('lumpSumMonth must be a positive integer');
  if (payment <= balance * annualRate / 1200) throw new RangeError('payment does not cover the monthly interest');

  const baseRows = payoffSchedule({ balance, annualRate, payment });
  let extraMonthlyUsed = extraMonthly;
  let target = null;
  if (targetMonths !== null) {
    const needed = extraNeededForTarget({ balance, annualRate, payment, extraYearly, lumpSum, lumpSumMonth, targetMonths });
    extraMonthlyUsed = needed;
    target = { months: targetMonths, extraMonthly: needed, alreadyMet: needed === 0 };
  }
  const planRows = payoffSchedule({ balance, annualRate, payment, extraMonthly: extraMonthlyUsed, extraYearly, lumpSum, lumpSumMonth });
  const base = totals(baseRows);
  const plan = totals(planRows);

  return {
    base: { ...base, schedule: baseRows },
    plan: { ...plan, schedule: planRows, extraMonthly: extraMonthlyUsed },
    target,
    monthsSaved: base.months - plan.months,
    interestSaved: base.totalInterest - plan.totalInterest
  };
}
