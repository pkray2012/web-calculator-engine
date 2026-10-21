/**
 * Adapter between the Electric Bill Calculator page and its engine. Parses
 * the form, calls calculateElectricBill() and shapes the result for display.
 * No formulas live here.
 */

import { calculateElectricBill, LIMITS } from '../../calculators/energy/electric-bill.js';
import { moneyField } from '../../lib/energy/money.js';
import { numberField } from '../../lib/validation.js';
import { roundHalfUp } from '../../lib/energy/format.js';

export const RATE_HINT = 'Enter dollars per kWh, for example 0.16 for 16¢.';

/** Illustrative example values, not typical or current prices. */
export const BILL_DEFAULTS = Object.freeze({
  kwh: '900',
  rate: '0.16',
  fixed: '12',
  days: '30'
});

/** Rate in dollars per kWh, 0 to 10: a rate typed in cents (16 for 16¢) gets a hint instead of a huge bill. */
export function rateField(rawValue, label = 'Energy rate') {
  const result = numberField(rawValue, { label, min: 0 });
  if (result.error) return result;
  return result.value > LIMITS.maxRate ? { error: RATE_HINT } : result;
}

export const formatCentsPerKwh = (cents) => `${roundHalfUp(cents, 2)}¢`;

export function parseBillForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const kwh = take('kwh', numberField(values.kwh, { label: 'Electricity used', min: 0, max: LIMITS.maxKwh }));
  const rate = take('rate', rateField(values.rate));
  const fixedCents = take('fixed', moneyField(values.fixed, { label: 'Fixed monthly charges', required: false, fallback: 0, min: 0, max: LIMITS.maxFixedCents / 100 }));
  const days = take('days', numberField(values.days, { label: 'Days in billing period', min: 1, max: LIMITS.maxDays, integer: true }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { kwh, rate, fixedCents, days } };
}

export function buildBillView(input) {
  const result = calculateElectricBill(input);
  return {
    input,
    result,
    averageText: result.averageCentsPerKwh === null ? null : formatCentsPerKwh(result.averageCentsPerKwh)
  };
}

/** Parse, validate and calculate. */
export function runBillCalculator(values) {
  const parsed = parseBillForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildBillView(parsed.input) };
}
