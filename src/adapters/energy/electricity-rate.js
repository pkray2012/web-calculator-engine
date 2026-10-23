/**
 * Adapter between the Electricity Rate Calculator page and its engine. Parses
 * the form, calls calculateElectricityRate() and shapes the result for
 * display. No formulas live here.
 */

import { calculateElectricityRate, RATE_LIMITS } from '../../calculators/energy/electricity-rate.js';
import { moneyField } from '../../lib/energy/money.js';
import { numberField } from '../../lib/validation.js';
import { formatCentsPerKwh } from './electric-bill.js';

/** The second result's label. It does not claim to be the energy rate: other per-kWh charges may remain. */
export const RESIDUAL_LABEL = 'Rate after entered exclusions';

export const RATE_NOTES = Object.freeze({
  residual: 'The rate after entered exclusions may still include per-kWh delivery charges, riders and taxes; it equals your plan\'s energy rate only if every other charge was entered as an exclusion.',
  allExcluded: 'Everything on the bill was entered as an exclusion, so nothing is left to divide by the kWh.',
  highAverage: 'Check the billing period and kWh: this average is more than $1 per kWh.'
});

/** Illustrative example values, not typical ones. */
export const RATE_DEFAULTS = Object.freeze({
  bill: '142.50',
  kwh: '950',
  fixed: '15.70'
});

export function parseRateForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const billCents = take('bill', moneyField(values.bill, { label: 'Bill total', min: RATE_LIMITS.minBillCents / 100, max: RATE_LIMITS.maxBillCents / 100 }));
  const kwh = take('kwh', numberField(values.kwh, { label: 'Electricity used', ...RATE_LIMITS.kwh }));
  const excludedCents = take('fixed', moneyField(values.fixed, { label: 'Charges to exclude', required: false, fallback: 0, min: 0, max: RATE_LIMITS.maxBillCents / 100 }));
  if (!errors.bill && !errors.fixed && excludedCents > billCents) errors.fixed = 'Charges to exclude cannot be more than the bill total.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { billCents, kwh, excludedCents } };
}

export function buildRateView(input) {
  const result = calculateElectricityRate(input);
  // With everything excluded there is no residual to describe, so only the all-excluded note is shown.
  /** @type {string[]} */
  const notes = [result.allExcluded ? RATE_NOTES.allExcluded : RATE_NOTES.residual];
  if (result.highAverage) notes.push(RATE_NOTES.highAverage);
  return {
    input,
    result,
    averageText: formatCentsPerKwh(result.averageCentsPerKwh),
    residualText: formatCentsPerKwh(result.residualCentsPerKwh),
    notes
  };
}

/** Parse, validate and calculate. */
export function runRateCalculator(values) {
  const parsed = parseRateForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildRateView(parsed.input) };
}
