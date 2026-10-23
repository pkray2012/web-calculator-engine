/**
 * Home Energy Batch 2b against the revision 8.1 reference vectors
 * (fixtures/batch2b_vectors_r8_1.json, from batch2b_reference_r8_1.py).
 *
 * The four approved drafts (B1-11, B2-6, B1-19, B1-20) are checked here.
 * B2-18 Water Heating Wattage is parked by the owner (2026-10-23), so its
 * vectors stay in the fixture unused and have no code.
 *
 * Each vector goes through the page's adapter exactly as typed form text. A
 * reference result must be reproduced within the per-unit tolerances (money
 * 0.005, everything else 1e-9) with identical display text; a reference
 * error must be a field error on the matching field.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { plainDecimal } from '../../../src/lib/energy/format.js';
import { runRoiCalculator } from '../../../src/adapters/energy/solar-roi.js';
import { runSolarSavingsCalculator } from '../../../src/adapters/energy/solar-savings.js';
import { runSizeCalculator } from '../../../src/adapters/energy/solar-panel-size.js';
import { runOutputCalculator } from '../../../src/adapters/energy/solar-panel-output.js';

const VECTORS = JSON.parse(readFileSync(new URL('./fixtures/batch2b_vectors_r8_1.json', import.meta.url), 'utf8'));
const PARKED = new Set(['water_heating_power']);

/** Form text for a reference input: numbers as plain decimals (never exponent notation), strings as typed. */
const text = (value) => (value === null || value === undefined ? '' : typeof value === 'number' ? plainDecimal(value) : String(value));

const MONEY = 0.005;
const EXACT = 1e-9;
const close = (actual, expected, tolerance, label) => {
  assert.ok(Number.isFinite(actual), `${label}: ${actual} is not finite`);
  const allowed = tolerance === MONEY ? MONEY : EXACT * Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= allowed, `${label}: ${actual} vs ${expected}`);
};

const RUNNERS = {
  solar_roi: {
    run: ({ cost, incentives, savings, maintenance, years }) => runRoiCalculator({
      cost: text(cost), incentives: text(incentives), savings: text(savings), maintenance: text(maintenance), years: text(years)
    }),
    fields: {},
    check(view, expected, name) {
      const { result } = view;
      assert.equal(result.defined, expected.defined, `${name} defined`);
      assert.equal(result.netCostCents, expected.net_cost_cents, `${name} net cost`);
      assert.equal(result.totalNetSavingsCents, expected.total_net_savings_cents, `${name} total`);
      assert.equal(result.netGainCents, expected.net_gain_cents, `${name} gain`);
      if (expected.roi_percent === null) assert.equal(result.roiPercent, null, `${name} ROI`);
      else close(result.roiPercent, expected.roi_percent, EXACT, `${name} ROI`);
      assert.equal(view.roiText, expected.display.roi, `${name} ROI text`);
      assert.equal(view.netCostText, expected.display.net_cost, `${name} net cost text`);
      assert.equal(view.totalText, expected.display.total_net_savings, `${name} total text`);
      assert.equal(view.gainText, expected.display.net_gain, `${name} gain text`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
    }
  },
  solar_savings: {
    run: ({ production, self_use: selfUse, retail_rate: retail, export_rate: exportRate, fees }) => runSolarSavingsCalculator({
      production: text(production), selfUse: text(selfUse), retailRate: text(retail), exportRate: text(exportRate), fees: text(fees)
    }),
    fields: { self_use: 'selfUse', retail_rate: 'retailRate', export_rate: 'exportRate' },
    check(view, expected, name) {
      const { result } = view;
      close(result.selfKwh, expected.self_kwh, EXACT, `${name} self-used`);
      close(result.exportedKwh, expected.exported_kwh, EXACT, `${name} exported`);
      close(result.usedValue, expected.used_value, MONEY, `${name} used value`);
      close(result.exportValue, expected.export_value, MONEY, `${name} export value`);
      close(result.savings, expected.savings, MONEY, `${name} savings`);
      close(result.savingsPerMonth, expected.savings_per_month, MONEY, `${name} per month`);
      if (expected.cents_per_solar_kwh === null) assert.equal(result.centsPerSolarKwh, null, `${name} per kWh`);
      else close(result.centsPerSolarKwh, expected.cents_per_solar_kwh, EXACT, `${name} per kWh`);
      assert.equal(view.savingsText, expected.display.savings, `${name} savings text`);
      assert.equal(view.perMonthText, expected.display.savings_per_month, `${name} per month text`);
      assert.equal(view.selfKwhText, expected.display.self_kwh, `${name} self-used text`);
      assert.equal(view.exportedKwhText, expected.display.exported_kwh, `${name} exported text`);
      assert.equal(view.perKwhText, expected.display.cents_per_solar_kwh, `${name} per kWh text`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
    }
  },
  solar_panel_size: {
    run: ({ annual_kwh: annual, sun_hours: sun, losses, panel_watts: panel }) => runSizeCalculator({
      annualKwh: text(annual), sunHours: text(sun), losses: text(losses), panelWatts: text(panel)
    }),
    fields: { annual_kwh: 'annualKwh', sun_hours: 'sunHours', panel_watts: 'panelWatts' },
    check(view, expected, name) {
      close(view.result.sizeKw, expected.size_kw, EXACT, `${name} size`);
      assert.equal(view.result.panels, expected.panels, `${name} panels`);
      assert.equal(view.sizeText, expected.display.size, `${name} size text`);
      assert.equal(view.panelsText, expected.display.panels, `${name} panels text`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
    }
  },
  solar_panel_output: {
    run: ({ size_kw: size, sun_hours: sun, losses }) => runOutputCalculator({ sizeKw: text(size), sunHours: text(sun), losses: text(losses) }),
    fields: { size_kw: 'sizeKw', sun_hours: 'sunHours' },
    check(view, expected, name) {
      close(view.result.dailyKwh, expected.daily_kwh, EXACT, `${name} daily`);
      close(view.result.annualKwh, expected.annual_kwh, EXACT, `${name} yearly`);
      close(view.result.monthlyKwh, expected.monthly_kwh, EXACT, `${name} monthly`);
      assert.equal(view.dailyText, expected.display.daily, `${name} daily text`);
      assert.equal(view.annualText, expected.display.annual, `${name} yearly text`);
      assert.equal(view.monthlyText, expected.display.monthly, `${name} monthly text`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
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

test('every reference vector is covered, except the parked B2-18 vectors', () => {
  assert.equal(VECTORS.length, 66);
  assert.equal(VECTORS.filter((vector) => PARKED.has(vector.fn)).length, 16);
  assert.ok(VECTORS.every((vector) => vector.fn in RUNNERS || PARKED.has(vector.fn)));
});

test('worked examples (spec r8.1)', () => {
  assert.equal(runRoiCalculator({ cost: '20000', incentives: '', savings: '1600', maintenance: '0', years: '25' }).view.roiText, '100.0%');
  assert.equal(runRoiCalculator({ cost: '20000', incentives: '', savings: '1000', maintenance: '0', years: '20' }).view.roiText, '0.0%', 'never "-0.0%"');
  assert.equal(runSolarSavingsCalculator({ production: '10000', selfUse: '60', retailRate: '0.16', exportRate: '0.05', fees: '' }).view.savingsText, '$1,160.00');
  const size = runSizeCalculator({ annualKwh: '7300', sunHours: '4', losses: '0', panelWatts: '500' }).view;
  assert.equal(size.sizeText, '5.00 kW');
  assert.equal(size.panelsText, '10', 'exactly 5 kW of 500 W panels is 10 panels, never 11');
  assert.equal(runOutputCalculator({ sizeKw: '7.6', sunHours: '4.5', losses: '14' }).view.monthlyText, '894.62 kWh', 'exactly 894.615 rounds up once (N-M5)');
});
