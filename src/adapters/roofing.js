/**
 * Adapter between the Roofing Calculator page and its engine. Parses raw form
 * values, calls calculateRoofing() and shapes the result for display. No
 * formulas live here.
 */

import { calculateRoofing } from '../calculators/roofing.js';
import { numberField } from '../lib/validation.js';

export const ROOFING_LIMITS = Object.freeze({ maxFeet: 500, maxRise: 24, maxBundles: 10, maxPrice: 1_000 });

/** Illustrative example values: a 40 × 30 ft footprint with overhangs and a 6/12 pitch. */
export const ROOFING_DEFAULTS = Object.freeze({
  lengthFeet: '40',
  widthFeet: '30',
  pitchRise: '6',
  wastePercent: '10',
  bundlesPerSquare: '3',
  pricePerBundle: ''
});

export function parseRoofingForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const size = (field, label) => take(field, numberField(values[field], { label, min: 0, minExclusive: true, max: ROOFING_LIMITS.maxFeet }));
  const lengthFeet = size('lengthFeet', 'Length');
  const widthFeet = size('widthFeet', 'Width');
  const pitchRise = take('pitchRise', numberField(values.pitchRise, { label: 'Roof pitch', min: 0, max: ROOFING_LIMITS.maxRise }));
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra for waste', required: false, fallback: 0, min: 0, max: 50 }));
  const bundlesPerSquare = take('bundlesPerSquare', numberField(values.bundlesPerSquare, { label: 'Bundles per square', min: 0, minExclusive: true, max: ROOFING_LIMITS.maxBundles }));
  const pricePerBundle = take('pricePerBundle', numberField(values.pricePerBundle, { label: 'Price per bundle', required: false, fallback: 0, min: 0, max: ROOFING_LIMITS.maxPrice }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { lengthFeet, widthFeet, pitchRise, wastePercent, bundlesPerSquare, pricePerBundle } };
}

export function buildRoofingView(input) {
  return { input, ...calculateRoofing(input) };
}

/** Parse, validate and calculate. */
export function runRoofingCalculator(values) {
  const parsed = parseRoofingForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildRoofingView(parsed.input) };
}
