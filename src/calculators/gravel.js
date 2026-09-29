/**
 * Gravel (or any bulk aggregate) for a rectangular or round area at a given
 * depth: cubic feet, cubic yards (1 yd³ = 27 ft³) and tons at a density in
 * short tons per cubic yard (1 short ton = 2,000 lb), with a compaction and
 * waste allowance and optional cost by ton or by yard. NIST Handbook 44,
 * Appendix C, defines both units.
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
export const POUNDS_PER_SHORT_TON = 2000;

/** Area in square feet: a rectangle (length × width) or a circle (diameter in feet). */
export function areaSquareFeet({ shape, lengthFeet = 0, widthFeet = 0, diameterFeet = 0 }) {
  if (shape === 'round') {
    positive('diameterFeet', diameterFeet);
    return Math.PI * (diameterFeet / 2) ** 2;
  }
  positive('lengthFeet', lengthFeet);
  positive('widthFeet', widthFeet);
  return lengthFeet * widthFeet;
}

export function calculateGravel({
  shape, lengthFeet, widthFeet, diameterFeet, depthInches, extraPercent = 0, tonsPerYard,
  pricePerTon = 0, pricePerYard = 0, deliveryFee = 0
}) {
  positive('depthInches', depthInches);
  positive('tonsPerYard', tonsPerYard);
  for (const [name, value] of Object.entries({ extraPercent, pricePerTon, pricePerYard, deliveryFee })) nonNegative(name, value);

  const area = areaSquareFeet({ shape, lengthFeet, widthFeet, diameterFeet });
  const netCubicFeet = area * depthInches / 12;
  const cubicFeet = netCubicFeet * (1 + extraPercent / 100);
  const cubicYards = cubicFeet / CUBIC_FEET_PER_YARD;
  const tons = cubicYards * tonsPerYard;
  return {
    area,
    netCubicFeet,
    cubicFeet,
    cubicYards,
    tons,
    pounds: tons * POUNDS_PER_SHORT_TON,
    // Square feet one ton covers at this depth, before the extra allowance.
    squareFeetPerTon: area / (netCubicFeet / CUBIC_FEET_PER_YARD * tonsPerYard),
    costByTon: pricePerTon > 0 ? tons * pricePerTon + deliveryFee : null,
    costByYard: pricePerYard > 0 ? cubicYards * pricePerYard + deliveryFee : null
  };
}
