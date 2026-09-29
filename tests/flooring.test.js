import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFlooring } from '../src/calculators/flooring.js';

// References from an independent Python calculation.
test('two rooms with 10% waste in 23.91 sq ft boxes', () => {
  const result = calculateFlooring({ rooms: [{ lengthFeet: 12, widthFeet: 15 }, { lengthFeet: 10, widthFeet: 11 }], wastePercent: 10, boxCoverage: 23.91, pricePerSquareFoot: 2.99 });
  assert.deepEqual(result.roomAreas, [180, 110]);
  assert.equal(result.area, 290);
  assert.ok(Math.abs(result.areaWithWaste - 319) < 1e-9);
  assert.equal(result.boxes, 14);
  assert.ok(Math.abs(result.purchased - 334.74) < 1e-9);
  assert.ok(Math.abs(result.leftover - 44.74) < 1e-9);
  assert.ok(Math.abs(result.costBySquareFoot - 1000.8726) < 1e-9);
  assert.equal(result.costByBox, null);
});

test('240 sq ft with no waste is 11 boxes of 23.91 sq ft', () => {
  assert.equal(calculateFlooring({ rooms: [{ lengthFeet: 20, widthFeet: 12 }], boxCoverage: 23.91 }).boxes, 11);
});

test('an exact multiple of the box coverage is not rounded up; price by box', () => {
  const result = calculateFlooring({ rooms: [{ lengthFeet: 10, widthFeet: 10 }], boxCoverage: 20, pricePerBox: 45 });
  assert.equal(result.boxes, 5);
  assert.equal(result.costByBox, 225);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateFlooring({ rooms: [], boxCoverage: 20 }), RangeError);
  assert.throws(() => calculateFlooring({ rooms: [{ lengthFeet: 10, widthFeet: 0 }], boxCoverage: 20 }), RangeError);
  assert.throws(() => calculateFlooring({ rooms: [{ lengthFeet: 10, widthFeet: 10 }], boxCoverage: 0 }), RangeError);
});
