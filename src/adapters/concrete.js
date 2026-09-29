/**
 * Adapter between the Concrete Calculator page and its engine. Parses raw form
 * values, calls calculateConcrete() and shapes the result for display. No
 * formulas live here.
 */

import { calculateConcrete } from '../calculators/concrete.js';
import { numberField } from '../lib/validation.js';

export const CONCRETE_LIMITS = Object.freeze({ maxFeet: 1000, maxInches: 120, maxQuantity: 1000, maxPrice: 10_000 });

/** Bag sizes offered, with typical yields; the form lets people change the yields to match their bag. */
export const CONCRETE_BAGS = Object.freeze([
  { pounds: 40, field: 'yield40' },
  { pounds: 60, field: 'yield60' },
  { pounds: 80, field: 'yield80' }
]);

/** Illustrative example values; yields are typical figures to check against the bag. */
export const CONCRETE_DEFAULTS = Object.freeze({
  shape: 'rect',
  lengthFeet: '10',
  widthFeet: '10',
  depthInches: '4',
  diameterInches: '10',
  depthFeet: '4',
  quantity: '1',
  wastePercent: '10',
  yield40: '0.30',
  yield60: '0.45',
  yield80: '0.60',
  bagPrice80: '',
  readyMixPricePerYard: '',
  deliveryFee: ''
});

export function parseConcreteForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const shape = values.shape === 'round' ? 'round' : 'rect';
  const size = (field, label, max) => take(field, numberField(values[field], { label, min: 0, minExclusive: true, max }));
  const piece = shape === 'rect'
    ? {
      shape,
      lengthFeet: size('lengthFeet', 'Length', CONCRETE_LIMITS.maxFeet),
      widthFeet: size('widthFeet', 'Width', CONCRETE_LIMITS.maxFeet),
      depthInches: size('depthInches', 'Thickness', CONCRETE_LIMITS.maxInches)
    }
    : {
      shape,
      diameterInches: size('diameterInches', 'Diameter', CONCRETE_LIMITS.maxInches),
      depthFeet: size('depthFeet', 'Depth', CONCRETE_LIMITS.maxFeet)
    };
  const quantity = take('quantity', numberField(values.quantity, { label: 'How many', min: 1, max: CONCRETE_LIMITS.maxQuantity, integer: true }));
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra for waste', required: false, fallback: 0, min: 0, max: 50 }));
  const yields = CONCRETE_BAGS.map((bag) => take(bag.field, numberField(values[bag.field], { label: `${bag.pounds} lb bag yield`, min: 0, minExclusive: true, max: 5 })));
  const price = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: CONCRETE_LIMITS.maxPrice }));
  const bagPrice80 = price('bagPrice80', 'Price per 80 lb bag');
  const readyMixPricePerYard = price('readyMixPricePerYard', 'Ready-mix price per cubic yard');
  const deliveryFee = price('deliveryFee', 'Delivery and short-load fees');
  if (Object.keys(errors).length) return { ok: false, errors };
  const bags = CONCRETE_BAGS.map((bag, index) => ({ pounds: bag.pounds, yieldCubicFeet: yields[index], price: bag.pounds === 80 ? bagPrice80 : 0 }));
  return { ok: true, input: { ...piece, quantity, wastePercent, bags, readyMixPricePerYard, deliveryFee } };
}

export function buildConcreteView(input) {
  const result = calculateConcrete(input);
  const bag80 = result.bags.find((bag) => bag.pounds === 80);
  const comparable = bag80.cost !== null && result.readyMixCost !== null;
  return { input, ...result, bag80, comparable };
}

/** Parse, validate and calculate. */
export function runConcreteCalculator(values) {
  const parsed = parseConcreteForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildConcreteView(parsed.input) };
}
