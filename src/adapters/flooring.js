/**
 * Adapter between the Flooring Calculator page and its engine. Parses raw
 * form values, calls calculateFlooring() and shapes the result for display.
 * No formulas live here.
 */

import { calculateFlooring } from '../calculators/flooring.js';
import { numberField } from '../lib/validation.js';

export const FLOORING_LIMITS = Object.freeze({ maxFeet: 500, maxCoverage: 200, maxPrice: 10_000 });

/** Room 1 is required; rooms 2 to 4 are used when both sizes are filled in. */
export const FLOORING_ROOMS = Object.freeze([1, 2, 3, 4]);

/** Illustrative example values; box coverage is printed on the carton. */
export const FLOORING_DEFAULTS = Object.freeze({
  room1Length: '12', room1Width: '15',
  room2Length: '10', room2Width: '11',
  room3Length: '', room3Width: '',
  room4Length: '', room4Width: '',
  wastePercent: '10',
  boxCoverage: '23.91',
  pricePerSquareFoot: '',
  pricePerBox: ''
});

export function parseFlooringForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const rooms = [];
  for (const n of FLOORING_ROOMS) {
    const lengthField = `room${n}Length`;
    const widthField = `room${n}Width`;
    const blank = (field) => String(values[field] ?? '').trim() === '';
    if (n > 1 && blank(lengthField) && blank(widthField)) continue;
    const size = (field, label) => take(field, numberField(values[field], { label, min: 0, minExclusive: true, max: FLOORING_LIMITS.maxFeet }));
    const lengthFeet = size(lengthField, `Room ${n} length`);
    const widthFeet = size(widthField, `Room ${n} width`);
    rooms.push({ room: n, lengthFeet, widthFeet });
  }
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra for waste', required: false, fallback: 0, min: 0, max: 50 }));
  const boxCoverage = take('boxCoverage', numberField(values.boxCoverage, { label: 'Coverage per box', min: 0, minExclusive: true, max: FLOORING_LIMITS.maxCoverage }));
  const price = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: FLOORING_LIMITS.maxPrice }));
  const pricePerSquareFoot = price('pricePerSquareFoot', 'Price per square foot');
  const pricePerBox = price('pricePerBox', 'Price per box');
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { rooms, wastePercent, boxCoverage, pricePerSquareFoot, pricePerBox } };
}

export function buildFlooringView(input) {
  return { input, ...calculateFlooring(input) };
}

/** Parse, validate and calculate. */
export function runFlooringCalculator(values) {
  const parsed = parseFlooringForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildFlooringView(parsed.input) };
}
