import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGravel, areaSquareFeet } from '../src/calculators/gravel.js';

// References from an independent Python calculation.
test('a 20 × 10 ft area, 3 in deep, 10% extra, at 1.4 tons per yard', () => {
  const result = calculateGravel({ shape: 'rect', lengthFeet: 20, widthFeet: 10, depthInches: 3, extraPercent: 10, tonsPerYard: 1.4, pricePerTon: 45, deliveryFee: 75 });
  assert.ok(Math.abs(result.cubicYards - 2.037037037037037) < 1e-12);
  assert.ok(Math.abs(result.tons - 2.851851851851852) < 1e-12);
  assert.ok(Math.abs(result.pounds - 5703.703703703704) < 1e-9);
  assert.ok(Math.abs(result.squareFeetPerTon - 77.14285714285714) < 1e-9);
  assert.ok(Math.abs(result.costByTon - 203.33333333333334) < 1e-9);
  assert.equal(result.costByYard, null);
});

test('a round bed 8 ft across, 2 in deep', () => {
  assert.ok(Math.abs(areaSquareFeet({ shape: 'round', diameterFeet: 8 }) - 16 * Math.PI) < 1e-12);
  const result = calculateGravel({ shape: 'round', diameterFeet: 8, depthInches: 2, tonsPerYard: 1.4 });
  assert.ok(Math.abs(result.tons - 0.4343930582741442) < 1e-12);
});

test('one cubic yard is 27 cubic feet: a 9 × 9 ft area 4 in deep is exactly 1 yard', () => {
  const result = calculateGravel({ shape: 'rect', lengthFeet: 9, widthFeet: 9, depthInches: 4, tonsPerYard: 1.5, pricePerYard: 40 });
  assert.ok(Math.abs(result.cubicYards - 1) < 1e-12);
  assert.ok(Math.abs(result.tons - 1.5) < 1e-12);
  assert.ok(Math.abs(result.costByYard - 40) < 1e-12);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateGravel({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 0, tonsPerYard: 1.4 }), RangeError);
  assert.throws(() => calculateGravel({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 2, tonsPerYard: 0 }), RangeError);
  assert.throws(() => calculateGravel({ shape: 'round', diameterFeet: -1, depthInches: 2, tonsPerYard: 1.4 }), RangeError);
});
