import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFence } from '../src/calculators/fence.js';

const base = { lengthFeet: 150, postSpacingFeet: 8, railsPerSection: 3, picketWidthInches: 5.5, gapInches: 0.25, wastePercent: 5 };

/** Board-by-board count: add pickets until they and their gaps cover the line. */
function bruteForcePickets(lengthFeet, width, gap) {
  let n = 1;
  while (n * width + (n - 1) * gap < lengthFeet * 12 - 1e-9) n += 1;
  return n;
}

// References from an independent Python calculation with exact fractions.
test('150 ft, posts every 8 ft, 3 rails, 5.5 in pickets with 0.25 in gaps, 5% extra', () => {
  const result = calculateFence({ ...base, pricePerPost: 20, pricePerRail: 9, pricePerPicket: 3 });
  assert.equal(result.sections, 19);
  assert.equal(result.posts, 20);
  assert.equal(result.rails, 57);
  assert.equal(result.picketsExact, 314);
  assert.equal(result.pickets, 330);
  assert.deepEqual(result.costs, { posts: 400, rails: 513, pickets: 990 });
  assert.equal(result.totalCost, 1903);
});

test('spaced pickets: 100 ft of 3.5 in pickets with 3.5 in gaps and 2 rails', () => {
  const result = calculateFence({ lengthFeet: 100, postSpacingFeet: 8, railsPerSection: 2, picketWidthInches: 3.5, gapInches: 3.5 });
  assert.deepEqual([result.sections, result.posts, result.rails, result.pickets], [13, 14, 26, 172]);
  assert.equal(result.totalCost, null);
});

test('a length that is an exact number of sections gets no extra post', () => {
  const result = calculateFence({ lengthFeet: 96, postSpacingFeet: 8, railsPerSection: 3, picketWidthInches: 5.5 });
  assert.equal(result.sections, 12);
  assert.equal(result.posts, 13);
  assert.equal(result.pickets, 210);
});

test('a short run still has two posts', () => {
  const result = calculateFence({ lengthFeet: 1, postSpacingFeet: 8, railsPerSection: 2, picketWidthInches: 5.5 });
  assert.deepEqual([result.sections, result.posts, result.rails, result.pickets], [1, 2, 2, 3]);
});

test('the picket formula matches a board-by-board count', () => {
  for (const [lengthFeet, width, gap] of [[150, 5.5, 0.25], [100, 3.5, 3.5], [40, 5.5, 0.5], [96, 5.5, 0], [7.3, 3.5, 1.75], [250, 5.5, 2]]) {
    const result = calculateFence({ lengthFeet, postSpacingFeet: 8, railsPerSection: 2, picketWidthInches: width, gapInches: gap });
    assert.equal(result.picketsExact, bruteForcePickets(lengthFeet, width, gap), `${lengthFeet} ft, ${width} in, ${gap} in gap`);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateFence({ ...base, lengthFeet: 0 }), RangeError);
  assert.throws(() => calculateFence({ ...base, postSpacingFeet: 0 }), RangeError);
  assert.throws(() => calculateFence({ ...base, railsPerSection: 1.5 }), RangeError);
  assert.throws(() => calculateFence({ ...base, picketWidthInches: -1 }), RangeError);
  assert.throws(() => calculateFence({ ...base, gapInches: Number.NaN }), RangeError);
});
