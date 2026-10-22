/**
 * Adapter between the Electricity Cost Calculator page and its engine. Parses
 * the form, calls calculateElectricityCost() and shapes the result for
 * display. No formulas live here.
 */

import { calculateElectricityCost, COST_LIMITS } from '../../calculators/energy/electricity-cost.js';
import { numberField } from '../../lib/validation.js';
import { formatKwh } from '../../lib/energy/format.js';
import { rateField } from './electric-bill.js';

export const ELECTRICITY_COST_NOTES = Object.freeze({
  nameplate: 'Nameplate watts are a maximum; appliances that cycle on and off use less.',
  highRate: 'Higher than any U.S. state\'s 2025 all-sector average (EIA).'
});

/** Illustrative example values (the power, hours and days of the Virginia Cooperative Extension example), not typical prices. */
export const ELECTRICITY_COST_DEFAULTS = Object.freeze({
  watts: '200',
  hours: '4',
  days: '120',
  rate: '0.15'
});

export function parseElectricityCostForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const watts = take('watts', numberField(values.watts, { label: 'Power', ...COST_LIMITS.watts }));
  const hours = take('hours', numberField(values.hours, { label: 'Hours used per day', ...COST_LIMITS.hours }));
  const days = take('days', numberField(values.days, { label: 'Days', ...COST_LIMITS.days, integer: true }));
  const rate = take('rate', rateField(values.rate, 'Electricity rate'));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { watts, hours, days, rate } };
}

export function buildElectricityCostView(input) {
  const result = calculateElectricityCost(input);
  return {
    input,
    result,
    kwhText: formatKwh(result.kwh),
    kwhPerDayText: formatKwh(result.kwhPerDay),
    notes: [ELECTRICITY_COST_NOTES.nameplate, ...(result.highRate ? [ELECTRICITY_COST_NOTES.highRate] : [])]
  };
}

/** Parse, validate and calculate. */
export function runElectricityCostCalculator(values) {
  const parsed = parseElectricityCostForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildElectricityCostView(parsed.input) };
}
