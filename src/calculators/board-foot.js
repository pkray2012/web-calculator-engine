/**
 * Board feet for one or more stacks of lumber.
 *
 * A board foot is a volume of 144 cubic inches: a board 1 inch thick, 12
 * inches wide and 1 foot long. For a piece T inches thick, W inches wide and
 * L feet long:
 *   board feet = T × W × L ÷ 12
 * Hardwood is priced by nominal (rough) thickness, so a "4/4" board counts as
 * 1 inch even after planing. A waste allowance is added to the total, and an
 * optional price per board foot gives the cost.
 */

function positive(name, value) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

function nonNegative(name, value) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} cannot be negative`);
}

export const boardFeet = ({ thicknessInches, widthInches, lengthFeet }) => thicknessInches * widthInches * lengthFeet / 12;

/**
 * @param {object} input
 * @param {Array<{ quantity: number, thicknessInches: number, widthInches: number, lengthFeet: number }>} input.pieces
 * @param {number} [input.wastePercent]
 * @param {number} [input.pricePerBoardFoot]
 */
export function calculateBoardFeet({ pieces, wastePercent = 0, pricePerBoardFoot = 0 }) {
  if (!Array.isArray(pieces) || pieces.length === 0) throw new RangeError('enter at least one piece');
  nonNegative('wastePercent', wastePercent);
  nonNegative('pricePerBoardFoot', pricePerBoardFoot);
  const rows = pieces.map((piece, index) => {
    if (!Number.isInteger(piece.quantity) || piece.quantity < 1) throw new RangeError(`row ${index + 1} quantity must be a whole number of 1 or more`);
    positive(`row ${index + 1} thickness`, piece.thicknessInches);
    positive(`row ${index + 1} width`, piece.widthInches);
    positive(`row ${index + 1} length`, piece.lengthFeet);
    const each = boardFeet(piece);
    return { ...piece, each, total: each * piece.quantity };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const withWaste = total * (1 + wastePercent / 100);
  return {
    rows,
    total,
    withWaste,
    cubicFeet: total / 12,
    linearFeet: rows.reduce((sum, row) => sum + row.lengthFeet * row.quantity, 0),
    cost: pricePerBoardFoot > 0 ? withWaste * pricePerBoardFoot : null
  };
}
