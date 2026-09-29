import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBoardFeet, boardFeet } from '../src/calculators/board-foot.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

// Hand-checked against the definition: 1 board foot = 144 cubic inches.
test('the definition: 1 in × 12 in × 1 ft is one board foot, 144 cubic inches', () => {
  assert.equal(boardFeet({ thicknessInches: 1, widthInches: 12, lengthFeet: 1 }), 1);
  // 2 × 6 × 8 ft (nominal): 2 × 6 × 96 = 1,152 cubic inches ÷ 144 = 8 board feet.
  assert.equal(boardFeet({ thicknessInches: 2, widthInches: 6, lengthFeet: 8 }), 8);
});

test('several stacks with waste and price', () => {
  const result = calculateBoardFeet({
    pieces: [
      { quantity: 10, thicknessInches: 1, widthInches: 6, lengthFeet: 8 },    // 4 bf each → 40
      { quantity: 4, thicknessInches: 1.25, widthInches: 8, lengthFeet: 10 }, // 5/4: 8.3333 each → 33.3333
      { quantity: 2, thicknessInches: 2, widthInches: 10, lengthFeet: 12 }    // 20 each → 40
    ],
    wastePercent: 15,
    pricePerBoardFoot: 6.5
  });
  close(result.rows[1].each, 8.333333333333334);
  close(result.total, 113.33333333333333);
  close(result.withWaste, 130.33333333333331);
  close(result.cost, 847.1666666666666);
  close(result.cubicFeet, 9.444444444444445);
  assert.equal(result.linearFeet, 144);
});

test('no price gives no cost', () => {
  assert.equal(calculateBoardFeet({ pieces: [{ quantity: 1, thicknessInches: 1, widthInches: 12, lengthFeet: 1 }] }).cost, null);
});

test('invalid inputs are rejected', () => {
  const piece = { quantity: 1, thicknessInches: 1, widthInches: 6, lengthFeet: 8 };
  assert.throws(() => calculateBoardFeet({ pieces: [] }), RangeError);
  assert.throws(() => calculateBoardFeet({ pieces: [{ ...piece, quantity: 0 }] }), RangeError);
  assert.throws(() => calculateBoardFeet({ pieces: [{ ...piece, quantity: 1.5 }] }), RangeError);
  assert.throws(() => calculateBoardFeet({ pieces: [{ ...piece, widthInches: 0 }] }), RangeError);
  assert.throws(() => calculateBoardFeet({ pieces: [piece], wastePercent: -1 }), RangeError);
});
