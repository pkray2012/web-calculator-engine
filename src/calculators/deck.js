/**
 * Materials for a rectangular deck with boards laid parallel to the house
 * across joists that run out from it.
 *
 * - Width is measured along the house (the direction the boards run); depth
 *   is measured out from the house (the direction the joists run).
 * - Board rows: n boards with n − 1 gaps cover n × width + (n − 1) × gap, so
 *   covering the depth takes ⌈(depth + gap) ÷ (board width + gap)⌉ rows.
 * - Each row takes ⌈deck width ÷ board length⌉ boards; offcuts are not reused,
 *   so the count is what a row-by-row layout uses. A waste allowance is added.
 * - Joists: one at each end plus one every spacing across the width,
 *   ⌈width ÷ spacing⌉ + 1, each as long as the deck is deep.
 * - Screws: a set number per board where it crosses each joist.
 * Framing sizes, spans, beams, posts and footings are not calculated; they
 * are set by the local building code.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

const EPSILON = 1e-9;

export function calculateDeck({
  widthFeet,
  depthFeet,
  boardWidthInches = 5.5,
  gapInches = 0.125,
  boardLengthFeet = 16,
  joistSpacingInches = 16,
  wastePercent = 0,
  screwsPerCrossing = 2,
  pricePerBoard = 0,
  pricePerJoist = 0
}) {
  for (const [name, value] of Object.entries({ widthFeet, depthFeet, boardWidthInches, boardLengthFeet, joistSpacingInches })) positive(name, value);
  for (const [name, value] of Object.entries({ gapInches, wastePercent, pricePerBoard, pricePerJoist })) nonNegative(name, value);
  if (!Number.isInteger(screwsPerCrossing) || screwsPerCrossing < 0) throw new RangeError('screwsPerCrossing must be a whole number of 0 or more');

  const rows = Math.ceil((depthFeet * 12 + gapInches) / (boardWidthInches + gapInches) - EPSILON);
  const boardsPerRow = Math.ceil(widthFeet / boardLengthFeet - EPSILON);
  const boardsExact = rows * boardsPerRow;
  const boards = Math.ceil(boardsExact * (1 + wastePercent / 100) - EPSILON);
  const joists = Math.ceil((widthFeet * 12) / joistSpacingInches - EPSILON) + 1;
  const costs = { boards: boards * pricePerBoard, joists: joists * pricePerJoist };
  const totalCost = costs.boards + costs.joists;
  return {
    areaSquareFeet: widthFeet * depthFeet,
    rows,
    boardsPerRow,
    boardsExact,
    boards,
    linearFeet: rows * widthFeet,
    joists,
    joistLengthFeet: depthFeet,
    screws: rows * joists * screwsPerCrossing,
    costs,
    totalCost: totalCost > 0 ? totalCost : null
  };
}
