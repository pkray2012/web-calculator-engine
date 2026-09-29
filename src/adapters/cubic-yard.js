/**
 * Adapter between the Cubic Yard Calculator page and its engine. Parses raw
 * form values, calls volumeNeeded() or areaCovered() and shapes the result for
 * display. No formulas live here.
 */

import { volumeNeeded, areaCovered } from '../calculators/cubic-yard.js';
import { numberField } from '../lib/validation.js';

export const CUBIC_YARD_LIMITS = Object.freeze({ maxFeet: 5000, maxInches: 120, maxCount: 500, maxYards: 10_000, maxPrice: 10_000 });

/**
 * Illustrative example: a 12 × 10 ft garden bed filled 3 inches deep. No
 * default density is set because it depends on the material and moisture.
 */
export const CUBIC_YARD_DEFAULTS = Object.freeze({
  mode: 'volume',
  shape: 'rect',
  lengthFeet: '12',
  widthFeet: '10',
  diameterFeet: '6',
  baseFeet: '8',
  heightFeet: '6',
  count: '1',
  cubicYards: '3',
  depthInches: '3',
  extraPercent: '5',
  bagCubicFeet: '2',
  truckYards: '',
  tonsPerYard: '',
  pricePerYard: '',
  deliveryFee: ''
});

export function parseCubicYardForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const mode = values.mode === 'coverage' ? 'coverage' : 'volume';
  const shape = ['round', 'triangle'].includes(values.shape) ? values.shape : 'rect';
  const size = (field, label, max) => take(field, numberField(values[field], { label, min: 0, minExclusive: true, max }));
  const optional = (field, label, max, extra = {}) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max, ...extra }));

  const depthInches = size('depthInches', 'Depth', CUBIC_YARD_LIMITS.maxInches);
  const extraPercent = optional('extraPercent', 'Extra for settling and waste', 50);
  const order = {
    bagCubicFeet: optional('bagCubicFeet', 'Bag size', 10),
    truckYards: optional('truckYards', 'Truck capacity', 50),
    tonsPerYard: optional('tonsPerYard', 'Weight per cubic yard', 3),
    pricePerYard: optional('pricePerYard', 'Price per cubic yard', CUBIC_YARD_LIMITS.maxPrice),
    deliveryFee: optional('deliveryFee', 'Delivery fee', CUBIC_YARD_LIMITS.maxPrice)
  };

  /** @type {{ count?: number, lengthFeet?: number, widthFeet?: number, diameterFeet?: number, baseFeet?: number, heightFeet?: number }} */
  let area = {};
  let cubicYards;
  if (mode === 'volume') {
    const feet = (field, label) => size(field, label, CUBIC_YARD_LIMITS.maxFeet);
    if (shape === 'rect') area = { lengthFeet: feet('lengthFeet', 'Length'), widthFeet: feet('widthFeet', 'Width') };
    else if (shape === 'round') area = { diameterFeet: feet('diameterFeet', 'Diameter') };
    else area = { baseFeet: feet('baseFeet', 'Base'), heightFeet: feet('heightFeet', 'Height') };
    area.count = take('count', numberField(values.count, { label: 'How many', min: 1, max: CUBIC_YARD_LIMITS.maxCount, integer: true }));
  } else {
    cubicYards = size('cubicYards', 'Cubic yards', CUBIC_YARD_LIMITS.maxYards);
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  const input = mode === 'volume'
    ? { mode, shape, ...area, depthInches, extraPercent, ...order }
    : { mode, cubicYards, depthInches, extraPercent, ...order };
  return { ok: true, input };
}

export function buildCubicYardView(input) {
  const { mode, ...rest } = input;
  return { input, mode, ...(mode === 'coverage' ? areaCovered(rest) : volumeNeeded(rest)) };
}

/** Parse, validate and calculate. */
export function runCubicYardCalculator(values) {
  const parsed = parseCubicYardForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildCubicYardView(parsed.input) };
}
