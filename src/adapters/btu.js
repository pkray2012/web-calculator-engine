/**
 * Adapter between the BTU Calculator page and its engine. Parses raw form
 * values, calls roomAcSize() and shapes the result for display. No formulas
 * live here.
 */

import { roomAcSize, MIN_SQUARE_FEET, MAX_SQUARE_FEET } from '../calculators/btu.js';
import { numberField } from '../lib/validation.js';

/** Illustrative example: a 16 × 20 ft sunny living room used by four people. */
export const BTU_DEFAULTS = Object.freeze({
  measure: 'dims',
  lengthFeet: '20',
  widthFeet: '16',
  squareFeet: '320',
  sun: 'sunny',
  people: '4',
  kitchen: ''
});

export function parseBtuForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const measure = values.measure === 'area' ? 'area' : 'dims';
  const sun = ['shaded', 'sunny'].includes(values.sun) ? values.sun : 'average';
  let squareFeet;
  let dims = {};
  if (measure === 'dims') {
    const lengthFeet = take('lengthFeet', numberField(values.lengthFeet, { label: 'Length', min: 0, minExclusive: true, max: 200 }));
    const widthFeet = take('widthFeet', numberField(values.widthFeet, { label: 'Width', min: 0, minExclusive: true, max: 200 }));
    dims = { lengthFeet, widthFeet };
    if (!errors.lengthFeet && !errors.widthFeet) {
      squareFeet = lengthFeet * widthFeet;
      if (squareFeet < MIN_SQUARE_FEET || squareFeet > MAX_SQUARE_FEET) {
        errors.widthFeet = `The room is ${Math.round(squareFeet).toLocaleString('en-US')} sq ft; this chart covers ${MIN_SQUARE_FEET} to ${MAX_SQUARE_FEET.toLocaleString('en-US')} sq ft.`;
      }
    }
  } else {
    squareFeet = take('squareFeet', numberField(values.squareFeet, { label: 'Room area', min: MIN_SQUARE_FEET, max: MAX_SQUARE_FEET }));
  }
  const people = take('people', numberField(values.people, { label: 'People', required: false, fallback: 2, min: 0, max: 50, integer: true }));
  const kitchen = values.kitchen === 'on';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { measure, ...dims, squareFeet, sun, people, kitchen } };
}

export function buildBtuView(input) {
  const { squareFeet, sun, people, kitchen } = input;
  return { input, ...roomAcSize({ squareFeet, sun, people, kitchen }) };
}

/** Parse, validate and calculate. */
export function runBtuCalculator(values) {
  const parsed = parseBtuForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildBtuView(parsed.input) };
}
