/**
 * Mulch (or bagged soil) for a rectangular or round bed: cubic feet, cubic
 * yards (1 yd³ = 27 ft³, NIST Handbook 44 Appendix C), whole bags of each
 * size, and optional cost for bags vs. bulk delivery. Also reports the area a
 * cubic yard covers at the chosen depth.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

export const CUBIC_FEET_PER_YARD = 27;

export function bedArea({ shape, lengthFeet = 0, widthFeet = 0, diameterFeet = 0 }) {
  if (shape === 'round') {
    positive('diameterFeet', diameterFeet);
    return Math.PI * (diameterFeet / 2) ** 2;
  }
  positive('lengthFeet', lengthFeet);
  positive('widthFeet', widthFeet);
  return lengthFeet * widthFeet;
}

/** bags: [{ cubicFeet, price? }]; pricePerYard and deliveryFee compare bulk delivery. */
export function calculateMulch({
  shape, lengthFeet, widthFeet, diameterFeet, quantity = 1, depthInches, bags = [], pricePerYard = 0, deliveryFee = 0
}) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new RangeError('quantity must be a positive whole number');
  positive('depthInches', depthInches);
  nonNegative('pricePerYard', pricePerYard);
  nonNegative('deliveryFee', deliveryFee);

  const area = bedArea({ shape, lengthFeet, widthFeet, diameterFeet }) * quantity;
  const cubicFeet = area * depthInches / 12;
  const cubicYards = cubicFeet / CUBIC_FEET_PER_YARD;
  const bagCounts = bags.map((bag) => {
    positive('cubicFeet', bag.cubicFeet);
    nonNegative('price', bag.price ?? 0);
    const count = Math.ceil(cubicFeet / bag.cubicFeet - 1e-9);
    return { ...bag, count, cost: bag.price ? count * bag.price : null };
  });
  return {
    area,
    cubicFeet,
    cubicYards,
    squareFeetPerYard: CUBIC_FEET_PER_YARD / (depthInches / 12),
    bags: bagCounts,
    bulkCost: pricePerYard > 0 ? cubicYards * pricePerYard + deliveryFee : null
  };
}
