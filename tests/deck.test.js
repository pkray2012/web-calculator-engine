import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeck } from '../src/calculators/deck.js';

const base = { widthFeet: 16, depthFeet: 12, boardWidthInches: 5.5, gapInches: 0.125, boardLengthFeet: 16, joistSpacingInches: 16, wastePercent: 10, screwsPerCrossing: 2 };

test('16 × 12 ft deck of 5.5-inch boards: 26 rows, 29 boards with 10% extra, 13 joists, 676 screws', () => {
  const result = calculateDeck(base);
  // (144 + 0.125) ÷ 5.625 = 25.62 → 26 rows; 192 in ÷ 16 = 12 spaces → 13 joists.
  assert.equal(result.areaSquareFeet, 192);
  assert.equal(result.rows, 26);
  assert.equal(result.boardsPerRow, 1);
  assert.equal(result.boardsExact, 26);
  assert.equal(result.boards, 29);
  assert.equal(result.linearFeet, 416);
  assert.equal(result.joists, 13);
  assert.equal(result.joistLengthFeet, 12);
  assert.equal(result.screws, 676);
  assert.equal(result.totalCost, null);
});

test('rows match a board-by-board layout', () => {
  for (const depthFeet of [1, 3.5, 8, 10, 12, 14.25, 20]) {
    for (const [width, gap] of [[5.5, 0.125], [3.5, 0.25], [5.5, 0], [7.25, 0.1875]]) {
      const { rows } = calculateDeck({ ...base, depthFeet, boardWidthInches: width, gapInches: gap });
      let covered = width;
      let n = 1;
      while (covered < depthFeet * 12 - 1e-9) { covered += gap + width; n += 1; }
      assert.equal(rows, n, `${depthFeet} ft with ${width} + ${gap}`);
    }
  }
});

test('exact fits do not add a row, board or joist', () => {
  // 11 in of depth: two 5.5-inch boards with no gap cover it exactly.
  const exact = calculateDeck({ ...base, depthFeet: 11 / 12, gapInches: 0, wastePercent: 0 });
  assert.equal(exact.rows, 2);
  assert.equal(calculateDeck({ ...base, widthFeet: 32 }).boardsPerRow, 2);
  assert.equal(calculateDeck({ ...base, widthFeet: 12, joistSpacingInches: 16 }).joists, 10);
  assert.equal(calculateDeck({ ...base, widthFeet: 12, joistSpacingInches: 12 }).joists, 13);
});

test('wider than a board: pieces per row, offcuts not reused', () => {
  const result = calculateDeck({ ...base, widthFeet: 20, wastePercent: 0 });
  assert.equal(result.boardsPerRow, 2);
  assert.equal(result.boardsExact, 52);
  assert.equal(calculateDeck({ ...base, widthFeet: 20, boardLengthFeet: 20, wastePercent: 0 }).boardsExact, 26);
});

test('costs', () => {
  const result = calculateDeck({ ...base, pricePerBoard: 32.5, pricePerJoist: 18 });
  assert.equal(result.costs.boards, 29 * 32.5);
  assert.equal(result.costs.joists, 13 * 18);
  assert.equal(result.totalCost, 29 * 32.5 + 13 * 18);
});

test('random decks match an independent calculation', () => {
  let seed = 11;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 2000; i++) {
    const input = {
      widthFeet: 1 + Math.round(rand() * 400) / 10,
      depthFeet: 1 + Math.round(rand() * 300) / 10,
      boardWidthInches: [3.5, 5.5, 7.25][Math.floor(rand() * 3)],
      gapInches: [0, 0.125, 0.1875, 0.25][Math.floor(rand() * 4)],
      boardLengthFeet: [8, 10, 12, 16, 20][Math.floor(rand() * 5)],
      joistSpacingInches: [12, 16, 24][Math.floor(rand() * 3)],
      wastePercent: Math.floor(rand() * 20),
      screwsPerCrossing: Math.floor(rand() * 3)
    };
    const r = calculateDeck(input);
    // Integer arithmetic (tenths of a foot, sixteenths of an inch) avoids floating-point edge cases.
    const depth10 = Math.round(input.depthFeet * 10);
    const board16 = Math.round(input.boardWidthInches * 16);
    const gap16 = Math.round(input.gapInches * 16);
    // depth in sixteenths × 10 = depth10 × 12 × 16.
    const rows = Math.ceil((depth10 * 12 * 16 + gap16 * 10) / ((board16 + gap16) * 10));
    const width10 = Math.round(input.widthFeet * 10);
    const perRow = Math.ceil(width10 / (input.boardLengthFeet * 10));
    const joists = Math.ceil(width10 * 12 / (input.joistSpacingInches * 10)) + 1;
    assert.equal(r.rows, rows);
    assert.equal(r.boardsPerRow, perRow);
    assert.equal(r.joists, joists);
    assert.equal(r.screws, rows * joists * input.screwsPerCrossing);
    assert.ok(r.boards >= r.boardsExact * (1 + input.wastePercent / 100) - 1e-9 && r.boards < r.boardsExact * (1 + input.wastePercent / 100) + 1);
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => calculateDeck({ ...base, widthFeet: 0 }), RangeError);
  assert.throws(() => calculateDeck({ ...base, depthFeet: -1 }), RangeError);
  assert.throws(() => calculateDeck({ ...base, boardWidthInches: NaN }), RangeError);
  assert.throws(() => calculateDeck({ ...base, gapInches: -0.1 }), RangeError);
  assert.throws(() => calculateDeck({ ...base, joistSpacingInches: 0 }), RangeError);
  assert.throws(() => calculateDeck({ ...base, screwsPerCrossing: 1.5 }), RangeError);
});
