import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAsphalt } from '../src/calculators/asphalt.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test('40 × 12 ft at 3 in and 145 lb/cu ft: 120 cu ft, 4.44 cu yd, 8.7 tons, 9.135 with 5%', () => {
  const r = calculateAsphalt({ lengthFeet: 40, widthFeet: 12, thicknessInches: 3, wastePercent: 5, pricePerTon: 100 });
  assert.equal(r.areaSquareFeet, 480);
  assert.equal(r.cubicFeet, 120);
  close(r.cubicYards, 120 / 27);
  assert.equal(r.pounds, 17400);
  close(r.tons, 8.7);
  close(r.tonsToOrder, 9.135);
  close(r.cost, 913.5);
});

test('tons scale with thickness and density; no price means no cost', () => {
  const base = calculateAsphalt({ lengthFeet: 50, widthFeet: 20, thicknessInches: 2 });
  close(calculateAsphalt({ lengthFeet: 50, widthFeet: 20, thicknessInches: 4 }).tons, base.tons * 2);
  close(calculateAsphalt({ lengthFeet: 50, widthFeet: 20, thicknessInches: 2, densityLbPerCuFt: 116 }).tons, base.tons * 116 / 145);
  assert.equal(base.cost, null);
  assert.equal(base.tonsToOrder, base.tons);
});

test('random areas match an independent calculation', () => {
  let seed = 23;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 2000; i++) {
    const L = 1 + rand() * 500, W = 1 + rand() * 200, t = 0.5 + rand() * 8, d = 100 + rand() * 60, w = rand() * 20;
    const r = calculateAsphalt({ lengthFeet: L, widthFeet: W, thicknessInches: t, densityLbPerCuFt: d, wastePercent: w });
    close(r.tonsToOrder, L * W * t / 12 * d / 2000 * (1 + w / 100));
    close(r.cubicYards * 27, r.cubicFeet);
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => calculateAsphalt({ lengthFeet: 0, widthFeet: 10, thicknessInches: 3 }), RangeError);
  assert.throws(() => calculateAsphalt({ lengthFeet: 10, widthFeet: 10, thicknessInches: -1 }), RangeError);
  assert.throws(() => calculateAsphalt({ lengthFeet: 10, widthFeet: 10, thicknessInches: 3, wastePercent: -5 }), RangeError);
  assert.throws(() => calculateAsphalt({ lengthFeet: 10, widthFeet: NaN, thicknessInches: 3 }), RangeError);
});
