/**
 * Adapter between the Compound Interest Calculator page and its engine.
 * Parses raw form values, calls calculateCompoundInterest() and shapes the
 * result for display. No formulas live here.
 */

import { calculateCompoundInterest, COMPOUNDING } from '../calculators/compound-interest.js';
import { numberField } from '../lib/validation.js';

export const COMPOUND_LIMITS = Object.freeze({ maxAmount: 100_000_000, maxRate: 50, maxYears: 100 });

/** Illustrative example values. */
export const COMPOUND_DEFAULTS = Object.freeze({
  initialDeposit: '10000',
  monthlyContribution: '200',
  ratePercent: '7',
  compounding: 'monthly',
  years: '20',
  contributionTiming: 'end',
  inflationPercent: ''
});

export function parseCompoundForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: COMPOUND_LIMITS.maxAmount }));
  const initialDeposit = money('initialDeposit', 'Initial deposit');
  const monthlyContribution = money('monthlyContribution', 'Monthly contribution');
  const ratePercent = take('ratePercent', numberField(values.ratePercent, { label: 'Interest rate', min: 0, max: COMPOUND_LIMITS.maxRate }));
  const years = take('years', numberField(values.years, { label: 'Years', min: 1, max: COMPOUND_LIMITS.maxYears, integer: true }));
  const inflationPercent = take('inflationPercent', numberField(values.inflationPercent, { label: 'Inflation rate', required: false, fallback: 0, min: 0, max: 20 }));
  const compounding = Object.hasOwn(COMPOUNDING, values.compounding) ? values.compounding : 'monthly';
  const contributionTiming = values.contributionTiming === 'start' ? 'start' : 'end';
  if (!errors.initialDeposit && !errors.monthlyContribution && initialDeposit === 0 && monthlyContribution === 0) {
    errors.initialDeposit = 'Enter an initial deposit, a monthly contribution, or both.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { initialDeposit, monthlyContribution, ratePercent, compounding, years, contributionTiming, inflationPercent } };
}

export function buildCompoundView(input) {
  return { input, ...calculateCompoundInterest(input) };
}

/** Parse, validate and calculate. */
export function runCompoundCalculator(values) {
  const parsed = parseCompoundForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildCompoundView(parsed.input) };
}
