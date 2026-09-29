/**
 * Asphalt for a rectangular area: volume from length × width × thickness,
 * weight from a compacted density, and tons to order with a waste allowance.
 *
 * - Volume (cu ft) = length (ft) × width (ft) × thickness (in) ÷ 12.
 * - Cubic yards = cubic feet ÷ 27; tons = cubic feet × density (lb/cu ft) ÷
 *   2,000 (US short tons).
 * - The waste allowance is added to the tonnage; cost is tons × price.
 */

function positive(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

export const DEFAULT_ASPHALT_DENSITY = 145;

export function calculateAsphalt({ lengthFeet, widthFeet, thicknessInches, densityLbPerCuFt = DEFAULT_ASPHALT_DENSITY, wastePercent = 0, pricePerTon = 0 }) {
  for (const [name, value] of Object.entries({ lengthFeet, widthFeet, thicknessInches, densityLbPerCuFt })) positive(name, value);
  nonNegative('wastePercent', wastePercent);
  nonNegative('pricePerTon', pricePerTon);
  const areaSquareFeet = lengthFeet * widthFeet;
  const cubicFeet = areaSquareFeet * (thicknessInches / 12);
  const tons = (cubicFeet * densityLbPerCuFt) / 2000;
  const tonsToOrder = tons * (1 + wastePercent / 100);
  return {
    areaSquareFeet,
    cubicFeet,
    cubicYards: cubicFeet / 27,
    pounds: cubicFeet * densityLbPerCuFt,
    tons,
    tonsToOrder,
    cost: pricePerTon > 0 ? tonsToOrder * pricePerTon : null
  };
}
