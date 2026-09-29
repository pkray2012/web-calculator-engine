/**
 * Adapter between the Loan Payoff Calculator page and its engine. Parses raw
 * form values, calls calculateLoanPayoff() and shapes the result for display.
 * No financial formulas live here.
 */

import { calculateLoanPayoff } from '../calculators/loan-payoff.js';
import { numberField, monthField } from '../lib/validation.js';
import { summarizeByYear } from './amortized-view.js';
import { paymentMonth } from '../lib/format.js';

export const PAYOFF_LIMITS = Object.freeze({ maxBalance: 10_000_000, maxRate: 40, maxTargetYears: 50, maxLumpMonth: 600 });

/** Illustrative example values; the page labels them as an example. */
export const PAYOFF_DEFAULTS = Object.freeze({
  balance: '250000',
  annualRate: '6.5',
  payment: '1600',
  mode: 'extra',
  extraMonthly: '200',
  targetYears: '15',
  extraYearly: '',
  lumpSum: '',
  lumpSumMonth: '',
  startMonth: ''
});

export function parsePayoffForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, rules = {}) => take(field, numberField(values[field], { label, min: 0, max: PAYOFF_LIMITS.maxBalance, ...rules }));
  const target = values.mode === 'target';
  const balance = money('balance', 'Balance owed', { minExclusive: true });
  const annualRate = take('annualRate', numberField(values.annualRate, { label: 'Interest rate', min: 0, max: PAYOFF_LIMITS.maxRate }));
  const payment = money('payment', 'Current monthly payment', { minExclusive: true });
  const extraMonthly = target ? 0 : money('extraMonthly', 'Extra each month', { required: false, fallback: 0 });
  const targetMonths = target
    ? take('targetYears', numberField(values.targetYears, { label: 'Years to pay off', min: 0, minExclusive: true, max: PAYOFF_LIMITS.maxTargetYears }))
    : null;
  const extraYearly = money('extraYearly', 'Extra once a year', { required: false, fallback: 0 });
  const lumpSum = money('lumpSum', 'One-time extra payment', { required: false, fallback: 0 });
  const lumpSumMonth = take('lumpSumMonth', numberField(values.lumpSumMonth, { label: 'Month of the one-time payment', required: false, fallback: 1, min: 1, max: PAYOFF_LIMITS.maxLumpMonth, integer: true }));
  const startMonth = take('startMonth', monthField(values.startMonth, { label: 'Next payment month' }));
  if (target && errors.targetYears === undefined && Math.abs(targetMonths * 12 - Math.round(targetMonths * 12)) > 1e-9) {
    errors.targetYears = 'Years to pay off must convert to whole months (for example 7.5 years).';
  }
  if (errors.balance === undefined && errors.annualRate === undefined && errors.payment === undefined && payment <= balance * annualRate / 1200) {
    errors.payment = `This payment does not cover the monthly interest of about $${(balance * annualRate / 1200).toFixed(2)}, so the balance would never fall.`;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: { balance, annualRate, payment, mode: target ? 'target' : 'extra', extraMonthly, targetMonths: target ? Math.round(targetMonths * 12) : null, extraYearly, lumpSum, lumpSumMonth, startMonth }
  };
}

export function buildPayoffView(input) {
  const result = calculateLoanPayoff(input);
  const dateAfter = (months) => (input.startMonth ? paymentMonth(input.startMonth, months) : null);
  return {
    input,
    base: { months: result.base.months, totalInterest: result.base.totalInterest, totalPaid: result.base.totalPaid, payoff: dateAfter(result.base.months) },
    plan: {
      months: result.plan.months,
      totalInterest: result.plan.totalInterest,
      totalPaid: result.plan.totalPaid,
      totalExtra: result.plan.totalExtra,
      extraMonthly: result.plan.extraMonthly,
      payoff: dateAfter(result.plan.months),
      yearly: summarizeByYear(result.plan.schedule)
    },
    target: result.target,
    monthsSaved: result.monthsSaved,
    interestSaved: result.interestSaved,
    hasExtras: result.plan.totalExtra > 0
  };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runPayoffCalculator(values) {
  const parsed = parsePayoffForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildPayoffView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { payment: 'At this payment the loan would take more than 100 years to pay off. Enter a higher payment.' } };
  }
}
