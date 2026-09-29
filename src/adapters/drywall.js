/**
 * Adapter between the Drywall Calculator page and its engine. Parses raw form
 * values, calls calculateDrywall() and shapes the result for display. No
 * formulas live here.
 */

import { calculateDrywall, DRYWALL_SHEETS } from '../calculators/drywall.js';
import { numberField } from '../lib/validation.js';

export const DRYWALL_LIMITS = Object.freeze({ maxFeet: 200, maxHeight: 30, maxOpenings: 50, maxOpeningArea: 200, maxPrice: 1_000 });

/**
 * Illustrative example values. A standard interior door is about 3 × 7 ft
 * (21 sq ft) and a mid-size window about 3 × 4 ft (12 sq ft).
 */
export const DRYWALL_DEFAULTS = Object.freeze({
  lengthFeet: '12',
  widthFeet: '14',
  heightFeet: '8',
  includeCeiling: 'on',
  doors: '1',
  doorArea: '21',
  windows: '2',
  windowArea: '12',
  wastePercent: '10',
  sheet: '4x8',
  pricePerSheet: ''
});

export function parseDrywallForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const size = (field, label, max) => take(field, numberField(values[field], { label, min: 0, minExclusive: true, max }));
  const lengthFeet = size('lengthFeet', 'Room length', DRYWALL_LIMITS.maxFeet);
  const widthFeet = size('widthFeet', 'Room width', DRYWALL_LIMITS.maxFeet);
  const heightFeet = size('heightFeet', 'Wall height', DRYWALL_LIMITS.maxHeight);
  const count = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: DRYWALL_LIMITS.maxOpenings, integer: true }));
  const openingArea = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: DRYWALL_LIMITS.maxOpeningArea }));
  const doors = count('doors', 'Number of doors');
  const doorArea = openingArea('doorArea', 'Area of each door');
  const windows = count('windows', 'Number of windows');
  const windowArea = openingArea('windowArea', 'Area of each window');
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra for waste', required: false, fallback: 0, min: 0, max: 50 }));
  const pricePerSheet = take('pricePerSheet', numberField(values.pricePerSheet, { label: 'Price per sheet', required: false, fallback: 0, min: 0, max: DRYWALL_LIMITS.maxPrice }));
  const sheet = DRYWALL_SHEETS.some((option) => option.id === values.sheet) ? values.sheet : DRYWALL_DEFAULTS.sheet;
  const includeCeiling = values.includeCeiling === 'on';
  if (!errors.lengthFeet && !errors.widthFeet && !errors.heightFeet && !errors.doors && !errors.doorArea && !errors.windows && !errors.windowArea
    && doors * doorArea + windows * windowArea >= 2 * (lengthFeet + widthFeet) * heightFeet) {
    errors.doors = 'Doors and windows add up to more than the wall area. Check the counts and sizes.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { lengthFeet, widthFeet, heightFeet, includeCeiling, doors, doorArea, windows, windowArea, wastePercent, sheet, pricePerSheet } };
}

export function buildDrywallView(input) {
  return { input, ...calculateDrywall(input) };
}

/** Parse, validate and calculate. */
export function runDrywallCalculator(values) {
  const parsed = parseDrywallForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildDrywallView(parsed.input) };
}
