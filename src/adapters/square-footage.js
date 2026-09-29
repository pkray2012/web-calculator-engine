/**
 * Adapter between the Square Footage Calculator page and its engine. Parses
 * raw form values, calls calculateSquareFootage() and shapes the result for
 * display. No formulas live here.
 */

import { calculateSquareFootage, LENGTH_UNITS, SHAPES } from '../calculators/square-footage.js';
import { numberField } from '../lib/validation.js';

/** Illustrative example: a 12 × 14 ft room. */
export const SQFT_DEFAULTS = Object.freeze({
  shape: 'rect',
  unit: 'ft',
  length: '12',
  width: '14',
  diameter: '10',
  base: '8',
  triHeight: '6',
  sideA: '10',
  sideB: '14',
  trapHeight: '8',
  count: '',
  price: ''
});

const FIELDS = Object.freeze({
  rect: [['length', 'length', 'Length'], ['width', 'width', 'Width']],
  circle: [['diameter', 'diameter', 'Diameter']],
  tri: [['base', 'base', 'Base'], ['triHeight', 'height', 'Height']],
  trap: [['sideA', 'sideA', 'Side a'], ['sideB', 'sideB', 'Side b'], ['trapHeight', 'height', 'Height']]
});

export function parseSquareFootageForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const shape = SHAPES.includes(values.shape) ? values.shape : 'rect';
  const unit = Object.hasOwn(LENGTH_UNITS, values.unit) ? values.unit : 'ft';
  const dims = {};
  for (const [field, key, label] of FIELDS[shape]) {
    dims[key] = take(field, numberField(values[field], { label, min: 0, minExclusive: true, max: 1_000_000 }));
  }
  const count = take('count', numberField(values.count, { label: 'Number of areas', required: false, fallback: 1, min: 1, max: 1000, integer: true }));
  const pricePerSquareFoot = take('price', numberField(values.price, { label: 'Price per square foot', required: false, fallback: 0, min: 0, max: 100_000 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { shape, unit, dims, count, pricePerSquareFoot } };
}

export function buildSquareFootageView(input) {
  return { input, ...calculateSquareFootage(input) };
}

/** Parse, validate and calculate. */
export function runSquareFootageCalculator(values) {
  const parsed = parseSquareFootageForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildSquareFootageView(parsed.input) };
}
