/**
 * Adapter between the EV Gas Savings Calculator page and its engine. Parses
 * the form, calls calculateEvGasSavings() and shapes the result for display.
 * No formulas live here. Miles below 1 is a field error here, before the Fuel
 * Cost engine (which throws for 0) is reached.
 */

import { calculateEvGasSavings, SavingsError, SAVINGS_LIMITS } from '../../calculators/energy/ev-gas-savings.js';
import { numberField } from '../../lib/validation.js';
import { formatPerMile } from '../../lib/energy/format.js';
import { rateField } from './electric-bill.js';

export const SAVINGS_NOTES = Object.freeze({
  gasCheaper: 'With these inputs the gas vehicle is cheaper to fuel.',
  highRate: 'Higher than any U.S. state\'s 2025 all-sector average (EIA).'
});

/** Illustrative example values, not typical ones. */
export const SAVINGS_DEFAULTS = Object.freeze({
  miles: '12000',
  kwhPer100Miles: '30',
  rate: '0.15',
  mpg: '30',
  pricePerGallon: '3.50'
});

export function parseSavingsForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const L = SAVINGS_LIMITS;
  const miles = take('miles', numberField(values.miles, { label: 'Miles per year', ...L.miles }));
  const kwhPer100Miles = take('kwhPer100Miles', numberField(values.kwhPer100Miles, { label: 'EV efficiency', ...L.epa }));
  const rate = take('rate', rateField(values.rate, 'Electricity rate'));
  const mpg = take('mpg', numberField(values.mpg, { label: 'Gas car fuel economy', ...L.mpg }));
  const pricePerGallon = take('pricePerGallon', numberField(values.pricePerGallon, { label: 'Gas price', min: 0, minExclusive: true, max: L.pricePerGallon.max }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { miles, kwhPer100Miles, rate, mpg, pricePerGallon } };
}

export function buildSavingsView(input) {
  const result = calculateEvGasSavings(input);
  const notes = [];
  if (result.highRate) notes.push(SAVINGS_NOTES.highRate);
  if (result.gasCheaper) notes.push(SAVINGS_NOTES.gasCheaper);
  return {
    input,
    result,
    evPerMileText: formatPerMile(result.evPerMileHundredthsOfCent),
    gasPerMileText: formatPerMile(result.gasPerMileHundredthsOfCent),
    notes
  };
}

/** Parse, validate and calculate. A result too extreme to calculate becomes a field error. */
export function runSavingsCalculator(values) {
  const parsed = parseSavingsForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildSavingsView(parsed.input) };
  } catch (error) {
    if (error instanceof SavingsError) return { ok: false, errors: { [error.field]: error.message } };
    throw error;
  }
}
