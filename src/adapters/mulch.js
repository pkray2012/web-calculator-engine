/**
 * Adapter between the Mulch Calculator page and its engine. Parses raw form
 * values, calls calculateMulch() and shapes the result for display. No
 * formulas live here.
 */

import { calculateMulch } from '../calculators/mulch.js';
import { numberField } from '../lib/validation.js';

export const MULCH_LIMITS = Object.freeze({ maxFeet: 1000, maxInches: 24, maxQuantity: 500, maxPrice: 10_000 });

/** Illustrative example values. */
export const MULCH_DEFAULTS = Object.freeze({
  shape: 'rect',
  lengthFeet: '12',
  widthFeet: '4',
  diameterFeet: '6',
  quantity: '2',
  depthInches: '3',
  bagSize: '2',
  bagPrice: '',
  pricePerYard: '',
  deliveryFee: ''
});

export function parseMulchForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const shape = values.shape === 'round' ? 'round' : 'rect';
  const size = (field, label, max) => take(field, numberField(values[field], { label, min: 0, minExclusive: true, max }));
  const bed = shape === 'rect'
    ? { lengthFeet: size('lengthFeet', 'Length', MULCH_LIMITS.maxFeet), widthFeet: size('widthFeet', 'Width', MULCH_LIMITS.maxFeet) }
    : { diameterFeet: size('diameterFeet', 'Diameter', MULCH_LIMITS.maxFeet) };
  const quantity = take('quantity', numberField(values.quantity, { label: 'Number of beds', min: 1, max: MULCH_LIMITS.maxQuantity, integer: true }));
  const depthInches = size('depthInches', 'Depth', MULCH_LIMITS.maxInches);
  const bagSize = take('bagSize', numberField(values.bagSize, { label: 'Bag size', min: 0.25, max: 10 }));
  const price = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: MULCH_LIMITS.maxPrice }));
  const bagPrice = price('bagPrice', 'Price per bag');
  const pricePerYard = price('pricePerYard', 'Bulk price per cubic yard');
  const deliveryFee = price('deliveryFee', 'Delivery fee');
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { shape, ...bed, quantity, depthInches, bagSize, bagPrice, pricePerYard, deliveryFee } };
}

export function buildMulchView(input) {
  const result = calculateMulch({ ...input, bags: [{ cubicFeet: input.bagSize, price: input.bagPrice }] });
  const [bag] = result.bags;
  return { input, ...result, bag, comparable: bag.cost !== null && result.bulkCost !== null };
}

/** Parse, validate and calculate. */
export function runMulchCalculator(values) {
  const parsed = parseMulchForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildMulchView(parsed.input) };
}
