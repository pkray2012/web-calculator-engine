/**
 * Adapter between the Gravel Calculator page and its engine. Parses raw form
 * values, calls calculateGravel() and shapes the result for display. No
 * formulas live here.
 */

import { calculateGravel } from '../calculators/gravel.js';
import { numberField } from '../lib/validation.js';

export const GRAVEL_LIMITS = Object.freeze({ maxFeet: 5000, maxInches: 48, maxPrice: 10_000 });

/** Illustrative example values; the density is a typical figure to confirm with the supplier. */
export const GRAVEL_DEFAULTS = Object.freeze({
  shape: 'rect',
  lengthFeet: '20',
  widthFeet: '10',
  diameterFeet: '8',
  depthInches: '3',
  extraPercent: '10',
  tonsPerYard: '1.4',
  pricePerTon: '',
  pricePerYard: '',
  deliveryFee: ''
});

export function parseGravelForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const shape = values.shape === 'round' ? 'round' : 'rect';
  const size = (field, label, max) => take(field, numberField(values[field], { label, min: 0, minExclusive: true, max }));
  const area = shape === 'rect'
    ? { lengthFeet: size('lengthFeet', 'Length', GRAVEL_LIMITS.maxFeet), widthFeet: size('widthFeet', 'Width', GRAVEL_LIMITS.maxFeet) }
    : { diameterFeet: size('diameterFeet', 'Diameter', GRAVEL_LIMITS.maxFeet) };
  const depthInches = size('depthInches', 'Depth', GRAVEL_LIMITS.maxInches);
  const extraPercent = take('extraPercent', numberField(values.extraPercent, { label: 'Extra for compaction and waste', required: false, fallback: 0, min: 0, max: 50 }));
  const tonsPerYard = take('tonsPerYard', numberField(values.tonsPerYard, { label: 'Weight per cubic yard', min: 0.5, max: 3 }));
  const price = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: GRAVEL_LIMITS.maxPrice }));
  const pricePerTon = price('pricePerTon', 'Price per ton');
  const pricePerYard = price('pricePerYard', 'Price per cubic yard');
  const deliveryFee = price('deliveryFee', 'Delivery fee');
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { shape, ...area, depthInches, extraPercent, tonsPerYard, pricePerTon, pricePerYard, deliveryFee } };
}

export function buildGravelView(input) {
  return { input, ...calculateGravel(input) };
}

/** Parse, validate and calculate. */
export function runGravelCalculator(values) {
  const parsed = parseGravelForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildGravelView(parsed.input) };
}
