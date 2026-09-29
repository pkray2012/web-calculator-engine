/**
 * Concrete volume for a rectangular slab or footing, or round holes and
 * columns, converted to cubic yards (1 yd³ = 27 ft³, NIST Handbook 44
 * Appendix C), with a waste allowance, whole bags of each size, and an
 * optional cost comparison between bags and ready-mix.
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

/** Volume in cubic feet of one piece. Lengths in feet, thickness and diameter in inches. */
export function pieceVolume({ shape, lengthFeet = 0, widthFeet = 0, depthInches = 0, diameterInches = 0, depthFeet = 0 }) {
  if (shape === 'round') {
    positive('diameterInches', diameterInches);
    positive('depthFeet', depthFeet);
    const radiusFeet = diameterInches / 12 / 2;
    return Math.PI * radiusFeet ** 2 * depthFeet;
  }
  positive('lengthFeet', lengthFeet);
  positive('widthFeet', widthFeet);
  positive('depthInches', depthInches);
  return lengthFeet * widthFeet * depthInches / 12;
}

/**
 * bags: [{ pounds, yieldCubicFeet, price? }]; readyMixPricePerYard and
 * deliveryFee are optional (0 = not compared).
 */
export function calculateConcrete({
  shape, lengthFeet, widthFeet, depthInches, diameterInches, depthFeet,
  quantity = 1, wastePercent = 0, bags = [], readyMixPricePerYard = 0, deliveryFee = 0
}) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new RangeError('quantity must be a positive whole number');
  nonNegative('wastePercent', wastePercent);
  nonNegative('readyMixPricePerYard', readyMixPricePerYard);
  nonNegative('deliveryFee', deliveryFee);

  const netCubicFeet = pieceVolume({ shape, lengthFeet, widthFeet, depthInches, diameterInches, depthFeet }) * quantity;
  const cubicFeet = netCubicFeet * (1 + wastePercent / 100);
  const cubicYards = cubicFeet / CUBIC_FEET_PER_YARD;
  const bagCounts = bags.map((bag) => {
    positive('yieldCubicFeet', bag.yieldCubicFeet);
    nonNegative('price', bag.price ?? 0);
    const count = Math.ceil(cubicFeet / bag.yieldCubicFeet - 1e-9);
    return { ...bag, count, weightPounds: count * bag.pounds, cost: bag.price ? count * bag.price : null };
  });
  const readyMixCost = readyMixPricePerYard > 0 ? cubicYards * readyMixPricePerYard + deliveryFee : null;
  return { netCubicFeet, cubicFeet, cubicYards, bags: bagCounts, readyMixCost };
}
