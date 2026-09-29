import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMulch, bedArea } from '../src/calculators/mulch.js';

// References from an independent Python calculation.
test('two 12 × 4 ft beds, 3 in deep: yards, bags and costs', () => {
  const result = calculateMulch({ shape: 'rect', lengthFeet: 12, widthFeet: 4, quantity: 2, depthInches: 3, bags: [{ cubicFeet: 2, price: 4.5 }, { cubicFeet: 3 }], pricePerYard: 40, deliveryFee: 60 });
  assert.equal(result.area, 96);
  assert.equal(result.cubicFeet, 24);
  assert.ok(Math.abs(result.cubicYards - 0.8888888888888888) < 1e-12);
  assert.deepEqual(result.bags.map((bag) => bag.count), [12, 8]);
  assert.equal(result.bags[0].cost, 54);
  assert.equal(result.bags[1].cost, null);
  assert.ok(Math.abs(result.bulkCost - 95.55555555555556) < 1e-9);
});

test('a cubic yard covers 108 sq ft at 3 in and 162 sq ft at 2 in', () => {
  assert.equal(calculateMulch({ shape: 'rect', lengthFeet: 1, widthFeet: 1, depthInches: 3 }).squareFeetPerYard, 108);
  assert.equal(calculateMulch({ shape: 'rect', lengthFeet: 1, widthFeet: 1, depthInches: 2 }).squareFeetPerYard, 162);
});

test('a tree ring 6 ft across', () => {
  assert.ok(Math.abs(bedArea({ shape: 'round', diameterFeet: 6 }) - 9 * Math.PI) < 1e-12);
});

test('exact multiples are not rounded up an extra bag; invalid input is rejected', () => {
  assert.equal(calculateMulch({ shape: 'rect', lengthFeet: 4, widthFeet: 2, depthInches: 3, bags: [{ cubicFeet: 2 }] }).bags[0].count, 1);
  assert.throws(() => calculateMulch({ shape: 'rect', lengthFeet: 4, widthFeet: 2, depthInches: 0 }), RangeError);
  assert.throws(() => calculateMulch({ shape: 'rect', lengthFeet: 4, widthFeet: 2, depthInches: 3, quantity: 0 }), RangeError);
});
