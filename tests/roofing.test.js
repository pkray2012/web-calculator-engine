import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRoofing, pitchFactor } from '../src/calculators/roofing.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

// References from an independent Python calculation.
test('40 × 30 ft footprint, 6/12 pitch, 10% waste, 3 bundles per square', () => {
  const result = calculateRoofing({ lengthFeet: 40, widthFeet: 30, pitchRise: 6, wastePercent: 10, bundlesPerSquare: 3, pricePerBundle: 35 });
  assert.equal(result.footprint, 1200);
  close(result.pitchFactor, 1.1180339887, 1e-10);
  close(result.roofArea, 1341.6407864999, 1e-9);
  close(result.squares, 13.416407865, 1e-9);
  close(result.squaresWithWaste, 14.7580486515, 1e-9);
  assert.equal(result.bundles, 45);
  assert.equal(result.squaresPurchased, 15);
  assert.equal(result.cost, 1575);
});

test('four bundles per square and a 12/12 pitch', () => {
  assert.equal(calculateRoofing({ lengthFeet: 40, widthFeet: 30, pitchRise: 6, wastePercent: 10, bundlesPerSquare: 4 }).bundles, 60);
  const steep = calculateRoofing({ lengthFeet: 40, widthFeet: 30, pitchRise: 12, wastePercent: 10, bundlesPerSquare: 3 });
  close(steep.roofArea, 1697.0562748477, 1e-9);
  assert.equal(steep.bundles, 57);
});

test('9/12 pitch has a factor of exactly 1.25', () => {
  const result = calculateRoofing({ lengthFeet: 52.5, widthFeet: 34, pitchRise: 9, wastePercent: 15, bundlesPerSquare: 3 });
  assert.equal(pitchFactor(9), 1.25);
  assert.equal(result.roofArea, 2231.25);
  assert.equal(result.bundles, 77);
  assert.equal(result.cost, null);
});

test('a flat roof whose area is a whole number of squares is not rounded up', () => {
  const result = calculateRoofing({ lengthFeet: 40, widthFeet: 30, pitchRise: 0, bundlesPerSquare: 3 });
  assert.equal(result.roofArea, 1200);
  assert.equal(result.bundles, 36);
});

test('the pitch factor matches face-by-face geometry of a hip roof', () => {
  // Hip roof on a 40 × 30 ft footprint at 6/12: two trapezoids and two triangles,
  // each face's area from 3-D cross products (computed independently in Python).
  close(calculateRoofing({ lengthFeet: 40, widthFeet: 30, pitchRise: 6, bundlesPerSquare: 3 }).roofArea, 1341.640786499874, 1e-9);
});

test('invalid inputs are rejected', () => {
  const roof = { lengthFeet: 40, widthFeet: 30, pitchRise: 6, bundlesPerSquare: 3 };
  assert.throws(() => calculateRoofing({ ...roof, lengthFeet: 0 }), RangeError);
  assert.throws(() => calculateRoofing({ ...roof, pitchRise: -1 }), RangeError);
  assert.throws(() => calculateRoofing({ ...roof, bundlesPerSquare: 0 }), RangeError);
  assert.throws(() => calculateRoofing({ ...roof, wastePercent: Number.NaN }), RangeError);
});
