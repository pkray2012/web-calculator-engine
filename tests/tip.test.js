import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTip } from '../src/calculators/tip.js';

test('$86.40 at 20% split three ways: $17.28 tip, $103.68 total, $34.56 each', () => {
  const r = calculateTip({ bill: 86.4, tipPercent: 20, people: 3 });
  assert.equal(r.tip, 17.28);
  assert.equal(r.total, 103.68);
  assert.equal(r.perPerson, 34.56);
  assert.equal(r.extra, 0);
});

test('shares that do not divide evenly round up to cover the total', () => {
  const r = calculateTip({ bill: 100, tipPercent: 15, people: 3 });
  assert.equal(r.total, 115);
  assert.equal(r.perPerson, 38.34);
  assert.equal(r.collected, 115.02);
  assert.equal(r.extra, 0.02);
});

test('round up to a whole dollar adds to the tip', () => {
  const r = calculateTip({ bill: 86.4, tipPercent: 20, people: 3, roundUp: true });
  assert.equal(r.perPerson, 35);
  assert.equal(r.total, 105);
  assert.equal(r.tip, 18.6);
  assert.ok(r.effectiveTipPercent > 20);
});

test('tip on the amount before tax', () => {
  const r = calculateTip({ bill: 86.4, tipPercent: 20, tax: 6.4, tipOnPreTax: true });
  assert.equal(r.tipBase, 80);
  assert.equal(r.tip, 16);
  assert.equal(r.total, 102.4);
  // Tax entered but pre-tax not chosen: tip on the full bill.
  assert.equal(calculateTip({ bill: 86.4, tipPercent: 20, tax: 6.4 }).tip, 17.28);
});

test('half-cent tips round up', () => {
  assert.equal(calculateTip({ bill: 10.05, tipPercent: 10 }).tip, 1.01); // 1.005
  assert.equal(calculateTip({ bill: 0.01, tipPercent: 0 }).tip, 0);
});

test('random bills: shares always cover the total; rounding up never pays less', () => {
  let seed = 21;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 5000; i++) {
    const bill = Math.round(rand() * 100_000) / 100 + 0.01;
    const tipPercent = Math.round(rand() * 30);
    const people = 1 + Math.floor(rand() * 12);
    const r = calculateTip({ bill, tipPercent, people });
    // Independent: integer cents.
    const cents = Math.round(bill * 100);
    const tipCents = Math.floor((cents * tipPercent) / 100 + 0.5 + 1e-9);
    assert.equal(Math.round(r.tip * 100), tipCents, `${bill} at ${tipPercent}%`);
    const totalCents = cents + tipCents;
    assert.equal(Math.round(r.perPerson * 100), Math.ceil(totalCents / people));
    assert.ok(r.collected >= r.total - 1e-9 && r.extra < people * 0.01 + 1e-9);
    const up = calculateTip({ bill, tipPercent, people, roundUp: true });
    assert.ok(Number.isInteger(up.perPerson) && up.total >= r.total - 1e-9 && up.total - r.total < people + 1e-9);
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => calculateTip({ bill: -1, tipPercent: 10 }), RangeError);
  assert.throws(() => calculateTip({ bill: 10, tipPercent: 10, people: 0 }), RangeError);
  assert.throws(() => calculateTip({ bill: 10, tipPercent: 10, people: 1.5 }), RangeError);
  assert.throws(() => calculateTip({ bill: 10, tipPercent: 10, tax: 11 }), RangeError);
  assert.throws(() => calculateTip({ bill: 10, tipPercent: NaN }), RangeError);
});
