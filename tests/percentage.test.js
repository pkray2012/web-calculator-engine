import test from 'node:test';
import assert from 'node:assert/strict';
import { percentOf, whatPercent, percentChange, percentOff } from '../src/calculators/percentage.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('15% of 80 is 12; 18 is 24% of 75', () => {
  assert.equal(percentOf({ percent: 15, of: 80 }).result, 12);
  assert.equal(whatPercent({ part: 18, whole: 75 }).percent, 24);
  assert.equal(percentOf({ percent: 250, of: 4 }).result, 10);
  assert.equal(whatPercent({ part: -5, whole: 20 }).percent, -25);
});

test('40 → 50 is +25%; back is −20%; difference 22.22%', () => {
  const change = percentChange({ from: 40, to: 50 });
  assert.equal(change.change, 10);
  assert.equal(change.percent, 25);
  assert.equal(change.reversePercent, -20);
  close(change.differencePercent, 200 / 9);
  assert.equal(percentChange({ from: 4, to: 5 }).percent, 25);
  assert.equal(percentChange({ from: 50, to: 0 }).reversePercent, null);
  // A negative starting value: change is measured against its size.
  assert.equal(percentChange({ from: -20, to: -10 }).percent, 50);
});

test('percent off and stacked discounts multiply', () => {
  const off = percentOff({ price: 120, percent: 25 });
  assert.equal(off.salePrice, 90);
  assert.equal(off.saving, 30);
  const stacked = percentOff({ price: 120, percent: 25, extraPercent: 10 });
  close(stacked.salePrice, 81);
  close(stacked.totalPercentOff, 32.5);
  close(percentOff({ price: 100, percent: 20, extraPercent: 10 }).totalPercentOff, 28);
  assert.equal(percentOff({ price: 0, percent: 50 }).totalPercentOff, 0);
});

test('random round trips', () => {
  let seed = 13;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 3000; i++) {
    const p = (rand() - 0.3) * 400;
    const y = 0.01 + rand() * 1e6;
    const part = percentOf({ percent: p, of: y }).result;
    close(whatPercent({ part, whole: y }).percent, p, 1e-9 * Math.max(1, Math.abs(p)));
    const a = 0.01 + rand() * 1e6;
    const b = 0.01 + rand() * 1e6;
    const forward = percentChange({ from: a, to: b });
    close(a * (1 + forward.percent / 100), b, 1e-9 * b);
    close(b * (1 + forward.reversePercent / 100), a, 1e-9 * a);
    assert.ok(forward.differencePercent >= 0 && forward.differencePercent < 200);
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => whatPercent({ part: 1, whole: 0 }), RangeError);
  assert.throws(() => percentChange({ from: 0, to: 5 }), RangeError);
  assert.throws(() => percentOff({ price: 10, percent: 101 }), RangeError);
  assert.throws(() => percentOff({ price: -1, percent: 10 }), RangeError);
  assert.throws(() => percentOf({ percent: NaN, of: 1 }), RangeError);
});
