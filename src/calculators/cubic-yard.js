/**
 * Cubic yards of any bulk material (soil, fill, sand, gravel, mulch, compost)
 * for one or more identical areas at a given depth, and the reverse: the area a
 * given number of cubic yards covers.
 *
 * - Area: rectangle (length × width), circle (π × (diameter ÷ 2)²) or
 *   triangle (base × height ÷ 2), in square feet.
 * - Volume: area × depth (inches ÷ 12) in cubic feet; ÷ 27 for cubic yards;
 *   × 0.764554857984 for cubic meters (1 yd = 0.9144 m exactly). NIST
 *   Handbook 44, Appendix C, defines these units.
 * - An optional extra percentage covers settling, compaction and waste.
 * - Bags, truckloads, weight and cost are optional conversions of the same
 *   volume; weight needs the material's density, which varies by material and
 *   moisture, so no default density is assumed.
 */

import { CUBIC_FEET_PER_YARD, POUNDS_PER_SHORT_TON } from './gravel.js';

export { CUBIC_FEET_PER_YARD };

/** 1 yard = 0.9144 meter exactly, so 1 cubic yard = 0.9144³ cubic meters. */
export const CUBIC_METERS_PER_YARD = 0.9144 ** 3;

export const SHAPES = Object.freeze(['rect', 'round', 'triangle']);

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

/** Area of one shape in square feet. */
export function shapeArea({ shape, lengthFeet = 0, widthFeet = 0, diameterFeet = 0, baseFeet = 0, heightFeet = 0 }) {
  if (shape === 'round') {
    positive('diameterFeet', diameterFeet);
    return Math.PI * (diameterFeet / 2) ** 2;
  }
  if (shape === 'triangle') {
    positive('baseFeet', baseFeet);
    positive('heightFeet', heightFeet);
    return baseFeet * heightFeet / 2;
  }
  if (shape !== 'rect') throw new RangeError(`unknown shape: ${shape}`);
  positive('lengthFeet', lengthFeet);
  positive('widthFeet', widthFeet);
  return lengthFeet * widthFeet;
}

/**
 * Conversions of an ordered volume (cubic yards) that apply in both directions.
 * @param {number} cubicYards
 * @param {OrderOptions} options
 */
function orderDetails(cubicYards, { bagCubicFeet = 0, truckYards = 0, tonsPerYard = 0, pricePerYard = 0, deliveryFee = 0 }) {
  for (const [name, value] of Object.entries({ bagCubicFeet, truckYards, tonsPerYard, pricePerYard, deliveryFee })) nonNegative(name, value);
  const cubicFeet = cubicYards * CUBIC_FEET_PER_YARD;
  const tons = tonsPerYard > 0 ? cubicYards * tonsPerYard : null;
  return {
    cubicFeet,
    cubicYards,
    cubicMeters: cubicYards * CUBIC_METERS_PER_YARD,
    // Whole bags and loads: you cannot buy part of one. A tiny tolerance keeps
    // exact multiples (e.g. 54 cu ft in 2 cu ft bags) from rounding up.
    bags: bagCubicFeet > 0 ? Math.ceil(cubicFeet / bagCubicFeet - 1e-9) : null,
    truckloads: truckYards > 0 ? Math.ceil(cubicYards / truckYards - 1e-9) : null,
    tons,
    pounds: tons === null ? null : tons * POUNDS_PER_SHORT_TON,
    cost: pricePerYard > 0 ? cubicYards * pricePerYard + deliveryFee : null
  };
}

/**
 * @typedef {object} OrderOptions
 * @property {number} [bagCubicFeet] bag size; 0 skips the bag count
 * @property {number} [truckYards] truck or trailer capacity; 0 skips the load count
 * @property {number} [tonsPerYard] material density; 0 skips the weight
 * @property {number} [pricePerYard]
 * @property {number} [deliveryFee]
 */

/**
 * Volume to order for `count` identical areas at `depthInches`, plus `extraPercent`.
 * @param {OrderOptions & {
 *   shape: 'rect'|'round'|'triangle', depthInches: number, count?: number, extraPercent?: number,
 *   lengthFeet?: number, widthFeet?: number, diameterFeet?: number, baseFeet?: number, heightFeet?: number
 * }} input
 */
export function volumeNeeded({ depthInches, count = 1, extraPercent = 0, ...rest }) {
  positive('depthInches', depthInches);
  positive('count', count);
  if (!Number.isInteger(count)) throw new RangeError('count must be a whole number');
  nonNegative('extraPercent', extraPercent);
  const areaEach = shapeArea(rest);
  const area = areaEach * count;
  const netCubicFeet = area * depthInches / 12;
  const cubicYards = netCubicFeet * (1 + extraPercent / 100) / CUBIC_FEET_PER_YARD;
  return {
    areaEach,
    area,
    netCubicFeet,
    netCubicYards: netCubicFeet / CUBIC_FEET_PER_YARD,
    // Square feet one cubic yard covers at this depth, before the allowance.
    squareFeetPerYard: CUBIC_FEET_PER_YARD / (depthInches / 12),
    ...orderDetails(cubicYards, rest)
  };
}

/**
 * Area that `cubicYards` covers at `depthInches`, after setting aside `extraPercent`
 * of the volume for settling, compaction and waste.
 * @param {OrderOptions & { cubicYards: number, depthInches: number, extraPercent?: number }} input
 */
export function areaCovered({ cubicYards, depthInches, extraPercent = 0, ...rest }) {
  positive('cubicYards', cubicYards);
  positive('depthInches', depthInches);
  nonNegative('extraPercent', extraPercent);
  const usableCubicFeet = cubicYards * CUBIC_FEET_PER_YARD / (1 + extraPercent / 100);
  const area = usableCubicFeet / (depthInches / 12);
  return {
    area,
    squareFeetPerYard: CUBIC_FEET_PER_YARD / (depthInches / 12),
    usableCubicFeet,
    // Side of a square with this area, as an easy way to picture it.
    squareSideFeet: Math.sqrt(area),
    ...orderDetails(cubicYards, rest)
  };
}
