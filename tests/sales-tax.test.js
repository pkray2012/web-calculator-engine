import test from 'node:test';
import assert from 'node:assert/strict';
import { addSalesTax, removeSalesTax, findSalesTaxRate, roundCents } from '../src/calculators/sales-tax.js';

test('$250 at 7.25% is $18.13 tax (18.125 rounds half up) and $268.13 total', () => {
  const result = addSalesTax({ price: 250, ratePercent: 7.25 });
  assert.equal(result.exactTax, 18.125);
  assert.equal(result.tax, 18.13);
  assert.equal(result.total, 268.13);
});

test('rounding to the cent is half up without binary artifacts', () => {
  assert.equal(roundCents(1.005), 1.01);
  assert.equal(roundCents(2.675), 2.68);
  assert.equal(roundCents(0.125), 0.13);
  assert.equal(roundCents(0.124999), 0.12);
  assert.equal(roundCents(10), 10);
  assert.equal(addSalesTax({ price: 19.99, ratePercent: 8.875 }).tax, 1.77); // 1.7741…
});

test('taking tax out of a total: $268.13 at 7.25% is $250.00 + $18.13', () => {
  const result = removeSalesTax({ total: 268.13, ratePercent: 7.25 });
  assert.equal(result.price, 250);
  assert.equal(result.tax, 18.13);
  assert.equal(removeSalesTax({ total: 107, ratePercent: 7 }).price, 100);
});

test('finding the rate: range contains the true rate', () => {
  const result = findSalesTaxRate({ price: 250, total: 268.13 });
  assert.equal(result.tax, 18.13);
  assert.ok(result.rateLowPercent <= 7.25 && 7.25 < result.rateHighPercent);
  assert.equal(findSalesTaxRate({ price: 100, total: 100 }).ratePercent, 0);
});

test('random round trips: add then remove returns the price; the rate range contains the rate', () => {
  let seed = 3;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 5000; i++) {
    const price = Math.round(rand() * 500_000) / 100 + 0.01;
    const ratePercent = Math.round(rand() * 1200) / 100; // 0 – 12%, two decimals
    const added = addSalesTax({ price, ratePercent });
    // Independent: tax in integer cents, half up.
    const cents = Math.round(price * 100);
    const expectedTaxCents = Math.floor((cents * Math.round(ratePercent * 100)) / 10000 + 0.5 + 1e-9);
    assert.equal(Math.round(added.tax * 100), expectedTaxCents, `${price} at ${ratePercent}%`);
    const found = findSalesTaxRate({ price, total: added.total });
    assert.ok(found.rateLowPercent - 1e-9 <= ratePercent && ratePercent <= found.rateHighPercent + 1e-9, `${price} at ${ratePercent}%`);
    const removed = removeSalesTax({ total: added.total, ratePercent });
    assert.ok(Math.abs(removed.price - price) <= 0.01 + 1e-9, `${price} at ${ratePercent}%: ${removed.price}`);
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => addSalesTax({ price: -1, ratePercent: 5 }), RangeError);
  assert.throws(() => addSalesTax({ price: 10, ratePercent: NaN }), RangeError);
  assert.throws(() => removeSalesTax({ total: 10, ratePercent: -2 }), RangeError);
  assert.throws(() => findSalesTaxRate({ price: 0, total: 10 }), RangeError);
  assert.throws(() => findSalesTaxRate({ price: 10, total: 9 }), RangeError);
});
