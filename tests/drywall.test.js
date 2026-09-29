import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDrywall } from '../src/calculators/drywall.js';

const sheetsBySize = (result) => Object.fromEntries(result.options.map((option) => [option.id, option.sheets]));

// References from an independent Python calculation with exact fractions.
test('12 × 14 ft room, 8 ft walls, ceiling, 1 door and 2 windows, 10% waste', () => {
  const result = calculateDrywall({ lengthFeet: 12, widthFeet: 14, heightFeet: 8, includeCeiling: true, doors: 1, doorArea: 21, windows: 2, windowArea: 12, wastePercent: 10, pricePerSheet: 15.5 });
  assert.equal(result.grossWallArea, 416);
  assert.equal(result.openingsArea, 45);
  assert.equal(result.wallArea, 371);
  assert.equal(result.ceilingArea, 168);
  assert.equal(result.area, 539);
  assert.ok(Math.abs(result.areaWithWaste - 592.9) < 1e-9);
  assert.equal(result.sheetArea, 32);
  assert.equal(result.sheets, 19);
  assert.equal(result.purchased, 608);
  assert.equal(result.cost, 294.5);
  assert.deepEqual(sheetsBySize(result), { '4x8': 19, '4x10': 15, '4x12': 13 });
});

test('the same room without the ceiling, in 4 × 12 sheets', () => {
  const result = calculateDrywall({ lengthFeet: 12, widthFeet: 14, heightFeet: 8, doors: 1, doorArea: 21, windows: 2, windowArea: 12, wastePercent: 10, sheet: '4x12' });
  assert.equal(result.ceilingArea, 0);
  assert.ok(Math.abs(result.areaWithWaste - 408.1) < 1e-9);
  assert.equal(result.sheets, 9);
  assert.equal(result.cost, null);
  assert.deepEqual(sheetsBySize(result), { '4x8': 13, '4x10': 11, '4x12': 9 });
});

test('fractional sizes, 9 ft walls, 15% waste', () => {
  const result = calculateDrywall({ lengthFeet: 11.5, widthFeet: 13, heightFeet: 9, includeCeiling: true, doors: 2, doorArea: 21, windows: 3, windowArea: 15, wastePercent: 15, sheet: '4x10' });
  assert.ok(Math.abs(result.area - 503.5) < 1e-9);
  assert.ok(Math.abs(result.areaWithWaste - 579.025) < 1e-9);
  assert.deepEqual(sheetsBySize(result), { '4x8': 19, '4x10': 15, '4x12': 13 });
  assert.equal(result.sheets, 15);
});

test('an area that is an exact number of sheets is not rounded up', () => {
  // 10 × 10 ft room, 8 ft walls: 320 sq ft = 10 sheets of 4 × 8 and 8 of 4 × 10.
  const result = calculateDrywall({ lengthFeet: 10, widthFeet: 10, heightFeet: 8 });
  assert.deepEqual(sheetsBySize(result), { '4x8': 10, '4x10': 8, '4x12': 7 });
});

test('invalid inputs are rejected', () => {
  const room = { lengthFeet: 10, widthFeet: 10, heightFeet: 8 };
  assert.throws(() => calculateDrywall({ ...room, heightFeet: 0 }), RangeError);
  assert.throws(() => calculateDrywall({ ...room, doors: 1.5, doorArea: 21 }), RangeError);
  assert.throws(() => calculateDrywall({ ...room, doors: 20, doorArea: 21 }), RangeError);
  assert.throws(() => calculateDrywall({ ...room, sheet: '4x9' }), RangeError);
  assert.throws(() => calculateDrywall({ ...room, wastePercent: -1 }), RangeError);
});
