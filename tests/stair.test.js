import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateStairs } from '../src/calculators/stair.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test('hand-checked: 108 in rise, 10.5 in treads, 1 in tread stock', () => {
  const s = calculateStairs({ totalRise: 108, treadDepth: 10.5, treadThickness: 1 });
  assert.equal(s.minimumRisers, 14);
  assert.equal(s.risers, 14);
  assert.equal(s.treads, 13);
  close(s.riserHeight, 108 / 14);
  close(s.totalRun, 136.5);
  close(s.angleDegrees, 36.30, 0.005);
  close(s.stepUnit, Math.sqrt((108 / 14) ** 2 + 10.5 ** 2));
  close(s.pitchLength, 169.38, 0.005);
  // Span: run 136.5 in, rise 108 − 1 = 107 in, projected onto the slope (review A3-001).
  close(s.minimumBoardLength, (136.5 * 10.5 + 107 * (108 / 14)) / s.stepUnit);
  close(s.minimumBoardLength, 173.36, 0.005);
  close(s.bottomStringerRiser, 108 / 14 - 1);
  assert.equal(s.riserOk, true);
  assert.equal(s.treadOk, true);
  assert.equal(s.handrailExpected, true);
});

test('the rise-and-run diagonal is a different slope from the stair (audit A-006)', () => {
  const s = calculateStairs({ totalRise: 108, treadDepth: 10.5 });
  const diagonalAngle = Math.atan2(108, 136.5) * 180 / Math.PI; // 38.35°
  assert.ok(diagonalAngle - s.angleDegrees > 2);
  assert.ok(Math.abs(s.pitchLength - Math.hypot(108, 136.5)) > 4);
});

test('minimum board length equals the span projected onto the stair slope', () => {
  for (const [rise, tread, thick] of [[108, 10.5, 1], [96, 11, 0], [30, 10, 1.5]]) {
    const s = calculateStairs({ totalRise: rise, treadDepth: tread, treadThickness: thick });
    const ux = tread / s.stepUnit;
    const uy = s.riserHeight / s.stepUnit;
    close(s.minimumBoardLength, s.totalRun * ux + (rise - thick) * uy);
    assert.ok(s.minimumBoardLength > s.pitchLength);
  }
});

test('a rise that is an exact multiple of the maximum riser is not given an extra step', () => {
  for (const [rise, expected] of [[77.5, 10], [93, 12], [85.25, 11], [7.75, 2]]) {
    const s = calculateStairs({ totalRise: rise, treadDepth: 10 });
    assert.equal(s.minimumRisers, Math.max(2, expected), `rise ${rise}`);
    assert.ok(s.riserHeight <= 7.75 + 1e-9);
  }
});

test('every option keeps risers equal and the run consistent', () => {
  const s = calculateStairs({ totalRise: 100, treadDepth: 11 });
  assert.equal(s.options.length, 4);
  s.options.forEach((option, index) => {
    assert.equal(option.risers, s.minimumRisers + index);
    close(option.riserHeight * option.risers, 100);
    close(option.totalRun, option.treads * 11);
    assert.equal(option.riserOk, true);
  });
  assert.ok(s.options[0].riserHeight > s.options[3].riserHeight);
});

test('a chosen riser count is used and checked against the limit', () => {
  const s = calculateStairs({ totalRise: 108, treadDepth: 10.5, risers: 13 });
  assert.equal(s.risers, 13);
  close(s.riserHeight, 108 / 13);
  assert.equal(s.riserOk, false); // 8.31 in is over 7.75 in
});

test('limits are inputs, not hard-coded', () => {
  const s = calculateStairs({ totalRise: 108, treadDepth: 9.5, maxRiser: 8.25, minTread: 9 });
  assert.equal(s.minimumRisers, 14); // 108 / 8.25 = 13.09
  assert.equal(s.treadOk, true);
  assert.equal(calculateStairs({ totalRise: 108, treadDepth: 9.5 }).treadOk, false);
});

test('short flights: fewer than 4 risers are flagged as not needing a handrail check', () => {
  const s = calculateStairs({ totalRise: 21, treadDepth: 11 });
  assert.equal(s.risers, 3);
  assert.equal(s.handrailExpected, false);
});

test('random rises always give risers at or under the limit with the fewest steps', () => {
  let seed = 3;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 2000; run += 1) {
    const totalRise = Math.round((8 + rand() * 200) * 16) / 16;
    const maxRiser = [7, 7.5, 7.75, 8.25][Math.floor(rand() * 4)];
    const s = calculateStairs({ totalRise, treadDepth: 10 + rand() * 2, maxRiser });
    assert.ok(s.riserHeight <= maxRiser + 1e-9);
    if (s.risers > 2) assert.ok(totalRise / (s.risers - 1) > maxRiser + 1e-9, `${totalRise} with ${s.risers}`);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateStairs({ totalRise: 0, treadDepth: 10 }), RangeError);
  assert.throws(() => calculateStairs({ totalRise: 100, treadDepth: -1 }), RangeError);
  assert.throws(() => calculateStairs({ totalRise: 100, treadDepth: 10, risers: 1 }), RangeError);
  assert.throws(() => calculateStairs({ totalRise: 100, treadDepth: 10, risers: 12.5 }), RangeError);
  assert.throws(() => calculateStairs({ totalRise: 100, treadDepth: 10, treadThickness: 9 }), RangeError);
  assert.throws(() => calculateStairs({ totalRise: 100, treadDepth: 10, treadThickness: -1 }), RangeError);
});

test('alternatives that leave no bottom cut are left out (review ZA-007)', () => {
  // 24 in rise, 5 in treads: 4 risers of 6 in work; 5, 6 and 7 risers would cut -0.2, -1 and -1.57 in.
  const s = calculateStairs({ totalRise: 24, treadDepth: 10, treadThickness: 5 });
  assert.equal(s.risers, 4);
  assert.ok(Math.abs(s.bottomStringerRiser - 1) < 1e-12);
  assert.deepEqual(s.options.map((o) => o.risers), [4]);
  assert.equal(s.optionsOmitted, 3);
  for (const option of s.options) assert.ok(option.bottomStringerRiser > 0);
  // A riser exactly as tall as the tread (zero cut) is also left out.
  const zero = calculateStairs({ totalRise: 24, treadDepth: 10, treadThickness: 4 });
  assert.deepEqual(zero.options.map((o) => o.risers), [4, 5]);
  assert.equal(zero.optionsOmitted, 2);
  // Every offered option can be chosen again without an error.
  for (const option of s.options.concat(zero.options)) {
    assert.doesNotThrow(() => calculateStairs({ totalRise: 24, treadDepth: 10, treadThickness: 4, risers: option.risers }));
  }
  // Thin treads keep all four alternatives.
  assert.equal(calculateStairs({ totalRise: 108, treadDepth: 10, treadThickness: 1 }).optionsOmitted, 0);
});
