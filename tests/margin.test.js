import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSale, priceForMargin, priceForMarkup, marginFromMarkup, markupFromMargin } from '../src/calculators/margin.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('$30 cost, $50 price: $20 profit, 40% margin, 66.67% markup', () => {
  const sale = analyzeSale({ cost: 30, price: 50 });
  assert.equal(sale.profit, 20);
  assert.equal(sale.marginPercent, 40);
  close(sale.markupPercent, 200 / 3);
  assert.equal(sale.breakEvenUnits, null);
});

test('price for a 40% margin on $30 is $50; a 40% markup is only a 28.57% margin', () => {
  const target = priceForMargin({ cost: 30, marginPercent: 40 });
  close(target.price, 50);
  close(target.marginPercent, 40);
  const markup = priceForMarkup({ cost: 30, markupPercent: 40 });
  close(markup.price, 42);
  close(markup.marginPercent, 200 / 7);
});

test('break-even units round up; none when the sale loses money', () => {
  assert.equal(analyzeSale({ cost: 30, price: 50, fixedCosts: 5000 }).breakEvenUnits, 250);
  assert.equal(analyzeSale({ cost: 30, price: 50, fixedCosts: 5001 }).breakEvenUnits, 251);
  assert.equal(analyzeSale({ cost: 30, price: 45, fixedCosts: 1000 }).breakEvenUnits, 67);
  assert.equal(analyzeSale({ cost: 60, price: 50, fixedCosts: 1000 }).breakEvenUnits, null);
  assert.equal(analyzeSale({ cost: 50, price: 50, fixedCosts: 1000 }).breakEvenUnits, null);
});

test('loss and zero cost', () => {
  const loss = analyzeSale({ cost: 60, price: 50 });
  assert.equal(loss.profit, -10);
  assert.equal(loss.marginPercent, -20);
  const free = analyzeSale({ cost: 0, price: 10 });
  assert.equal(free.marginPercent, 100);
  assert.equal(free.markupPercent, null);
});

test('conversions: 50% margin = 100% markup; 25% markup = 20% margin; they invert', () => {
  assert.equal(markupFromMargin(50), 100);
  assert.equal(marginFromMarkup(25), 20);
  for (let m = 0; m < 99; m += 0.37) close(marginFromMarkup(markupFromMargin(m)), m, 1e-9);
});

test('random: pricing for a margin or markup gives it back exactly', () => {
  let seed = 9;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 3000; i++) {
    const cost = 0.01 + rand() * 10_000;
    const margin = rand() * 95;
    const markup = rand() * 500;
    const a = priceForMargin({ cost, marginPercent: margin });
    close(a.marginPercent, margin, 1e-7);
    close(a.markupPercent, markupFromMargin(margin), 1e-6 * Math.max(1, a.markupPercent));
    const b = priceForMarkup({ cost, markupPercent: markup });
    close(b.markupPercent, markup, 1e-7 * Math.max(1, markup));
    close(b.marginPercent, marginFromMarkup(markup), 1e-7);
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => analyzeSale({ cost: 10, price: 0 }), RangeError);
  assert.throws(() => analyzeSale({ cost: -1, price: 10 }), RangeError);
  assert.throws(() => priceForMargin({ cost: 10, marginPercent: 100 }), RangeError);
  assert.throws(() => priceForMargin({ cost: 0, marginPercent: 10 }), RangeError);
  assert.throws(() => priceForMarkup({ cost: 10, markupPercent: -5 }), RangeError);
  assert.throws(() => analyzeSale({ cost: 10, price: 20, fixedCosts: NaN }), RangeError);
});
