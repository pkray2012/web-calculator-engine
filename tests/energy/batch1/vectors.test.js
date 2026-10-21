/**
 * Home Energy Batch 1 against the revision 6.2 reference vectors
 * (fixtures/batch1_vectors_r6.json, from batch1_reference_r6.py).
 *
 * Each vector goes through the page's adapter exactly as typed form text, so
 * parsing, limits, cross-field rules and the engine are all exercised. A
 * reference result must be reproduced within the per-unit tolerances (money
 * 0.005, everything else 1e-9) with identical display text; a reference
 * error must be a field error on the matching field.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { plainDecimal } from '../../../src/lib/energy/format.js';
import { runUtilityCalculator } from '../../../src/adapters/energy/utility-cost.js';
import { runPpwCalculator } from '../../../src/adapters/energy/solar-price-per-watt.js';
import { runBillCalculator } from '../../../src/adapters/energy/electric-bill.js';
import { runPaybackCalculator } from '../../../src/adapters/energy/solar-payback.js';
import { formatCurrency } from '../../../src/lib/format.js';

const VECTORS = JSON.parse(readFileSync(new URL('./fixtures/batch1_vectors_r6.json', import.meta.url), 'utf8'));

/** Form text for a reference input: numbers as plain decimals (never exponent notation), strings as typed. */
export const text = (value) => (value === null || value === undefined ? '' : typeof value === 'number' ? plainDecimal(value) : String(value));

const MONEY = 0.005;
const EXACT = 1e-9;
/** Money is compared absolutely (half a cent); other units relative to their size. */
const close = (actual, expected, tolerance, label) => {
  assert.ok(Number.isFinite(actual), `${label}: ${actual} is not finite`);
  const allowed = tolerance === MONEY ? MONEY : EXACT * Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= allowed, `${label}: ${actual} vs ${expected}`);
};

/**
 * Per reference function: how to build form values, the reference-to-form
 * field names for errors, and how to check a result.
 */
const RUNNERS = {
  utility_cost: {
    run: (input) => runUtilityCalculator(Object.fromEntries(Object.entries(input).map(([key, value]) => [key, text(value)]))),
    fields: {},
    check(view, expected, name) {
      close(view.result.monthly, expected.monthly, MONEY, `${name} monthly`);
      close(view.result.twelveTimesMonthly, expected.annual, MONEY, `${name} 12 × monthly`);
      if (expected.shares === null) {
        assert.equal(view.shares, null, `${name} shares`);
        assert.equal(view.message, 'Enter at least one amount.');
        return;
      }
      assert.deepEqual(view.shares.map((row) => row.category).sort(), Object.keys(expected.shares).sort(), `${name} share categories`);
      for (const row of view.shares) {
        close(row.share, expected.shares[row.category], EXACT, `${name} ${row.category} share`);
        assert.equal(row.shareText, expected.shares_display[row.category], `${name} ${row.category} share text`);
      }
      assert.equal(view.sharesNote, expected.shares_note, `${name} shares note`);
    }
  },
  price_per_watt: {
    run: ({ price, size, unit = 'kW', incentives }) => runPpwCalculator({ price: text(price), size: text(size), unit, incentives: text(incentives) }),
    fields: {},
    check(view, expected, name) {
      close(view.result.watts, expected.watts, EXACT, `${name} watts`);
      close(view.result.grossPerWatt, expected.gross_per_w, EXACT, `${name} gross`);
      close(view.result.netPerWatt, expected.net_per_w, EXACT, `${name} net`);
      assert.equal(view.gross, expected.display.gross, `${name} gross text`);
      assert.equal(view.net, expected.display.net, `${name} net text`);
    }
  },
  electric_bill: {
    run: ({ kwh, rate, fixed = 0, days = 30 }) => runBillCalculator({ kwh: text(kwh), rate: text(rate), fixed: text(fixed), days: text(days) }),
    fields: {},
    check(view, expected, name) {
      close(view.result.bill, expected.bill, MONEY, `${name} bill`);
      close(view.result.daily, expected.daily, MONEY, `${name} daily`);
      close(view.result.twelveTimesBill, expected.annual_repetition, MONEY, `${name} 12 × bill`);
      if (expected.avg_cents_per_kwh === null) assert.equal(view.result.averageCentsPerKwh, null, `${name} average`);
      else close(view.result.averageCentsPerKwh, expected.avg_cents_per_kwh, EXACT, `${name} average`);
      assert.equal(view.result.highRate, expected.rate_note, `${name} rate note`);
    }
  },
  simple_payback: {
    run: ({ cost, savings, incentives, maintenance = 0 }) => runPaybackCalculator({ cost: text(cost), savings: text(savings), incentives: text(incentives), maintenance: text(maintenance) }),
    fields: {},
    check(view, expected, name) {
      const outcome = { payback: 'payback', 'recovered at installation': 'recovered' }[expected.result] ?? 'undefined';
      assert.equal(view.result.outcome, outcome, `${name} outcome`);
      if (expected.years === null) assert.equal(view.result.years, null, `${name} years`);
      else close(view.result.years, expected.years, EXACT, `${name} years`);
      assert.equal(view.display, expected.display, `${name} display`);
      assert.equal(view.note, expected.note ?? null, `${name} note`);
      close(view.netCost, expected.net_cost, MONEY, `${name} net cost`);
      close(view.netSavings, expected.net_savings, MONEY, `${name} net savings`);
      assert.equal(formatCurrency(view.netCost), expected.net_cost_display, `${name} net cost text`);
      assert.equal(formatCurrency(view.netSavings), expected.net_savings_display, `${name} net savings text`);
    }
  }
};

for (const fn of Object.keys(RUNNERS)) {
  const vectors = VECTORS.filter((vector) => vector.fn === fn);
  test(`${fn}: ${vectors.length} reference vectors`, () => {
    assert.ok(vectors.length > 0);
    const runner = RUNNERS[fn];
    for (const vector of vectors) {
      const outcome = runner.run(vector.input);
      if (vector.error_field) {
        assert.equal(outcome.ok, false, `${vector.name}: expected a field error on ${vector.error_field}, got a result`);
        const field = runner.fields[vector.error_field] ?? vector.error_field;
        assert.ok(field in outcome.errors, `${vector.name}: expected an error on ${field}, got ${JSON.stringify(outcome.errors)}`);
      } else {
        assert.equal(outcome.ok, true, `${vector.name}: expected a result, got ${JSON.stringify(outcome.errors)}`);
        runner.check(outcome.view, vector.output, vector.name);
      }
    }
  });
}
