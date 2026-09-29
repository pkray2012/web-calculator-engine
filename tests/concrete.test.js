import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateConcrete, pieceVolume, CUBIC_FEET_PER_YARD } from '../src/calculators/concrete.js';

const BAGS = [{ pounds: 40, yieldCubicFeet: 0.3 }, { pounds: 60, yieldCubicFeet: 0.45 }, { pounds: 80, yieldCubicFeet: 0.6, price: 6.5 }];

test('a 10 × 10 ft slab, 4 in thick, is 33⅓ ft³ before waste', () => {
  assert.ok(Math.abs(pieceVolume({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 4 }) - 100 / 3) < 1e-12);
  assert.equal(CUBIC_FEET_PER_YARD, 27);
});

// References from an independent Python calculation.
test('slab with 10% waste: yards, whole bags and costs', () => {
  const result = calculateConcrete({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 4, wastePercent: 10, bags: BAGS, readyMixPricePerYard: 180, deliveryFee: 100 });
  assert.ok(Math.abs(result.cubicYards - 1.358024691358025) < 1e-12);
  assert.deepEqual(result.bags.map((bag) => bag.count), [123, 82, 62]);
  assert.equal(result.bags[2].cost, 403);
  assert.equal(result.bags[0].cost, null);
  assert.ok(Math.abs(result.readyMixCost - 344.44444444444446) < 1e-9);
});

test('six round holes, 10 in across and 4 ft deep, with 5% waste', () => {
  const result = calculateConcrete({ shape: 'round', diameterInches: 10, depthFeet: 4, quantity: 6, wastePercent: 5, bags: BAGS });
  assert.ok(Math.abs(result.cubicFeet - 13.744467859455346) < 1e-9);
  assert.equal(result.bags[2].count, 23);
  assert.equal(result.readyMixCost, null);
});

test('an exact multiple of a bag yield is not rounded up an extra bag', () => {
  // 3 ft × 1 ft × 2.4 in = 0.6 ft³ exactly one 80 lb bag.
  const result = calculateConcrete({ shape: 'rect', lengthFeet: 3, widthFeet: 1, depthInches: 2.4, bags: [BAGS[2]] });
  assert.equal(result.bags[0].count, 1);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateConcrete({ shape: 'rect', lengthFeet: 0, widthFeet: 1, depthInches: 4 }), RangeError);
  assert.throws(() => calculateConcrete({ shape: 'round', diameterInches: 10, depthFeet: 4, quantity: 1.5 }), RangeError);
  assert.throws(() => calculateConcrete({ shape: 'rect', lengthFeet: 1, widthFeet: 1, depthInches: 4, bags: [{ pounds: 80, yieldCubicFeet: 0 }] }), RangeError);
});
