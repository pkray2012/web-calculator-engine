/**
 * Adapter between the Stair Calculator page and its engine. Parses raw form
 * values, calls the engine and shapes the result for display. No formulas
 * live here.
 */

import { calculateStairs } from '../calculators/stair.js';
import { numberField } from '../lib/validation.js';

/**
 * Example: a 9 ft (108 in) floor-to-floor rise with 10½ in treads. The limit
 * defaults are the 2021 IRC R311.7.5 residential values; local codes differ.
 */
export const STAIR_DEFAULTS = Object.freeze({
  totalRise: '108',
  treadDepth: '10.5',
  treadThickness: '1',
  risers: '',
  maxRiser: '7.75',
  minTread: '10'
});

export function parseStairForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const totalRise = take('totalRise', numberField(values.totalRise, { label: 'Total rise', min: 1, max: 600 }));
  const treadDepth = take('treadDepth', numberField(values.treadDepth, { label: 'Tread depth', min: 1, max: 48 }));
  const treadThickness = take('treadThickness', numberField(values.treadThickness, { label: 'Tread thickness', required: false, fallback: 0, min: 0, max: 6 }));
  const risers = take('risers', numberField(values.risers, { label: 'Number of risers', required: false, fallback: null, min: 2, max: 100, integer: true }));
  const maxRiser = take('maxRiser', numberField(values.maxRiser, { label: 'Maximum riser height', min: 1, max: 24 }));
  const minTread = take('minTread', numberField(values.minTread, { label: 'Minimum tread depth', min: 1, max: 48 }));
  if (!errors.totalRise && !errors.risers && !errors.treadThickness && treadThickness >= totalRise / (risers ?? Math.max(2, Math.ceil(totalRise / (maxRiser || 1) - 1e-9)))) {
    errors.treadThickness = 'Tread thickness must be less than the riser height.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { totalRise, treadDepth, treadThickness, risers, maxRiser, minTread } };
}

export function buildStairView(input) {
  return { input, result: calculateStairs(input) };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runStairCalculator(values) {
  const parsed = parseStairForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildStairView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { totalRise: 'These measurements do not make a usable stair. Check the rise, tread and riser count.' } };
  }
}
