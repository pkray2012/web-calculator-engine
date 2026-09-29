/**
 * Adapter between the Asphalt Calculator page and its engine. Parses raw form
 * values, calls calculateAsphalt() and shapes the result for display. No
 * formulas live here.
 */

import { calculateAsphalt } from '../calculators/asphalt.js';
import { numberField } from '../lib/validation.js';

/** Illustrative example: a 40 × 12 ft driveway, 3 inches thick, 5% extra. */
export const ASPHALT_DEFAULTS = Object.freeze({
  lengthFeet: '40',
  widthFeet: '12',
  thicknessInches: '3',
  densityLbPerCuFt: '145',
  wastePercent: '5',
  pricePerTon: ''
});

export function parseAsphaltForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const lengthFeet = take('lengthFeet', numberField(values.lengthFeet, { label: 'Length', min: 0, minExclusive: true, max: 10_000 }));
  const widthFeet = take('widthFeet', numberField(values.widthFeet, { label: 'Width', min: 0, minExclusive: true, max: 10_000 }));
  const thicknessInches = take('thicknessInches', numberField(values.thicknessInches, { label: 'Thickness', min: 0, minExclusive: true, max: 24 }));
  const densityLbPerCuFt = take('densityLbPerCuFt', numberField(values.densityLbPerCuFt, { label: 'Density', required: false, fallback: 145, min: 50, max: 200 }));
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra', required: false, fallback: 0, min: 0, max: 50 }));
  const pricePerTon = take('pricePerTon', numberField(values.pricePerTon, { label: 'Price per ton', required: false, fallback: 0, min: 0, max: 10_000 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { lengthFeet, widthFeet, thicknessInches, densityLbPerCuFt, wastePercent, pricePerTon } };
}

export function buildAsphaltView(input) {
  return { input, ...calculateAsphalt(input) };
}

/** Parse, validate and calculate. */
export function runAsphaltCalculator(values) {
  const parsed = parseAsphaltForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildAsphaltView(parsed.input) };
}
