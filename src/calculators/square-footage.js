/**
 * Square footage of common shapes, with unit conversions.
 *
 * - Rectangle: length × width. Circle: π × (diameter ÷ 2)². Triangle:
 *   base × height ÷ 2. Trapezoid: (side a + side b) ÷ 2 × height.
 * - Dimensions may be entered in feet, inches, yards, meters or centimeters;
 *   they are converted to feet first (1 ft = 12 in = 1/3 yd = 0.3048 m exactly).
 * - Results: square feet, square inches (× 144), square yards (÷ 9), square
 *   meters (× 0.09290304) and acres (÷ 43,560).
 * - Optional: several identical areas, and a price per square foot.
 */

export const LENGTH_UNITS = Object.freeze({
  ft: { label: 'feet', feet: 1 },
  in: { label: 'inches', feet: 1 / 12 },
  yd: { label: 'yards', feet: 3 },
  m: { label: 'meters', feet: 1 / 0.3048 },
  cm: { label: 'centimeters', feet: 1 / 30.48 }
});

export const SHAPES = Object.freeze(['rect', 'circle', 'tri', 'trap']);

const SQ_M_PER_SQ_FT = 0.09290304;
const SQ_FT_PER_ACRE = 43_560;

function positive(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

/** Area of one shape in the entered unit squared. */
export function shapeArea(shape, dims) {
  if (shape === 'rect') { positive('length', dims.length); positive('width', dims.width); return dims.length * dims.width; }
  if (shape === 'circle') { positive('diameter', dims.diameter); return Math.PI * (dims.diameter / 2) ** 2; }
  if (shape === 'tri') { positive('base', dims.base); positive('height', dims.height); return (dims.base * dims.height) / 2; }
  if (shape === 'trap') {
    positive('side a', dims.sideA); positive('side b', dims.sideB); positive('height', dims.height);
    return ((dims.sideA + dims.sideB) / 2) * dims.height;
  }
  throw new RangeError(`unknown shape: ${shape}`);
}

/**
 * @param {object} input
 * @param {string} input.shape one of SHAPES
 * @param {Record<string, number>} input.dims dimensions for the shape
 * @param {keyof typeof LENGTH_UNITS} [input.unit]
 * @param {number} [input.count] identical areas
 * @param {number} [input.pricePerSquareFoot]
 */
export function calculateSquareFootage({ shape, dims, unit = 'ft', count = 1, pricePerSquareFoot = 0 }) {
  if (!Object.hasOwn(LENGTH_UNITS, unit)) throw new RangeError(`unknown unit: ${unit}`);
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a whole number of 1 or more');
  if (!Number.isFinite(pricePerSquareFoot) || pricePerSquareFoot < 0) throw new RangeError('pricePerSquareFoot cannot be negative');
  const toFeet = LENGTH_UNITS[unit].feet;
  const eachSquareFeet = shapeArea(shape, dims) * toFeet * toFeet;
  const squareFeet = eachSquareFeet * count;
  return {
    eachSquareFeet,
    squareFeet,
    squareInches: squareFeet * 144,
    squareYards: squareFeet / 9,
    squareMeters: squareFeet * SQ_M_PER_SQ_FT,
    acres: squareFeet / SQ_FT_PER_ACRE,
    cost: pricePerSquareFoot > 0 ? squareFeet * pricePerSquareFoot : null
  };
}
