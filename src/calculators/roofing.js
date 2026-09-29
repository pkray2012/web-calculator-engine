/**
 * Roofing shingles for a roof with one pitch on every face: the roof area is
 * the footprint (including overhangs) × the pitch factor √(1 + (rise ÷ 12)²),
 * which holds for gable and hip roofs alike. Area is counted in roofing
 * squares of 100 sq ft; a waste allowance is added, and bundles are bought
 * whole at the bundles-per-square printed on the wrapper.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

export const SQUARE_FEET_PER_SQUARE = 100;

/** Pitch factor for a rise of `rise` inches per 12 inches of run. */
export const pitchFactor = (rise) => Math.sqrt(1 + (rise / 12) ** 2);

export function calculateRoofing({ lengthFeet, widthFeet, pitchRise, wastePercent = 0, bundlesPerSquare = 3, pricePerBundle = 0 }) {
  positive('lengthFeet', lengthFeet);
  positive('widthFeet', widthFeet);
  nonNegative('pitchRise', pitchRise);
  nonNegative('wastePercent', wastePercent);
  positive('bundlesPerSquare', bundlesPerSquare);
  nonNegative('pricePerBundle', pricePerBundle);

  const footprint = lengthFeet * widthFeet;
  const factor = pitchFactor(pitchRise);
  const roofArea = footprint * factor;
  const squares = roofArea / SQUARE_FEET_PER_SQUARE;
  const squaresWithWaste = squares * (1 + wastePercent / 100);
  const bundles = Math.ceil(squaresWithWaste * bundlesPerSquare - 1e-9);
  return {
    footprint,
    pitchFactor: factor,
    roofArea,
    squares,
    squaresWithWaste,
    bundles,
    squaresPurchased: bundles / bundlesPerSquare,
    cost: pricePerBundle > 0 ? bundles * pricePerBundle : null
  };
}
