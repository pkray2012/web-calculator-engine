/**
 * productCentsOf (src/lib/energy/money.js, added for Batch 2): the exact
 * product of several factors, divided by a whole number, in whole cents
 * rounded half up.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productCentsOf, productCents } from '../../../src/lib/energy/money.js';

test('productCentsOf is exact at half a cent and agrees with productCents for two factors', () => {
  assert.equal(productCentsOf([125, 24, 1, 0.145], 1000), 44, '0.435 → 44 cents, not 43');
  assert.equal(productCentsOf([200, 4, 120, 0.085], 1000), 816);
  assert.equal(productCentsOf([0.1, 3, 1, 1], 1), 30, '0.1 × 3 is exactly 0.30');
  assert.equal(productCentsOf([1_000_000, 24, 366, 10], 1000), 8_784_000_000);
  assert.equal(productCentsOf([100, 0, 30, 0.15], 1000), 0);
  for (const [x, y] of [[3, 0.145], [900, 0.16], [0.005, 1], [1e-7, 0.5]]) assert.equal(productCentsOf([x, y]), productCents(x, y), `${x} × ${y}`);
});
