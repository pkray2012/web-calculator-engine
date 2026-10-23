/**
 * Home Energy Batch 2 against the revision 7.1 reference vectors
 * (fixtures/batch2_vectors_r7_1.json, from batch2_reference_r7_1.py).
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
import { formatCurrency } from '../../../src/lib/format.js';
import { formatKwh, plainDecimal } from '../../../src/lib/energy/format.js';
import { runElectricityCostCalculator } from '../../../src/adapters/energy/electricity-cost.js';
import { runRateCalculator, RESIDUAL_LABEL } from '../../../src/adapters/energy/electricity-rate.js';
import { runPerMileCalculator } from '../../../src/adapters/energy/ev-cost-per-mile.js';
import { runSavingsCalculator } from '../../../src/adapters/energy/ev-gas-savings.js';
import { electricityRatePage } from '../../../src/pages/energy/electricity-rate-calculator.js';
import { rateResults } from '../../../src/components/energy/electricity-rate-results.js';

const FIGURE_TYPES = { epa_kwh_per_100mi: 'epa', dashboard_mi_per_kwh: 'dashboard' };
const VECTORS = JSON.parse(readFileSync(new URL('./fixtures/batch2_vectors_r7_1.json', import.meta.url), 'utf8'));

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
  electricity_cost: {
    run: ({ watts, hours, days, rate }) => runElectricityCostCalculator({ watts: text(watts), hours: text(hours), days: text(days), rate: text(rate) }),
    fields: {},
    check(view, expected, name) {
      close(view.result.kwhPerDay, expected.kwh_per_day, EXACT, `${name} kWh per day`);
      close(view.result.kwh, expected.kwh, EXACT, `${name} kWh`);
      close(view.result.cost, expected.cost, MONEY, `${name} cost`);
      assert.equal(view.result.costCents, expected.cost_cents, `${name} cost cents`);
      assert.equal(view.result.costPerDayCents, expected.cost_per_day_cents, `${name} cost per day cents`);
      assert.equal(view.result.highRate, expected.rate_note, `${name} rate note`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
      assert.equal(view.kwhText, expected.display.kwh, `${name} kWh text`);
      assert.equal(view.kwhPerDayText, expected.display.kwh_per_day, `${name} kWh per day text`);
      assert.equal(formatCurrency(view.result.costCents / 100), expected.display.cost, `${name} cost text`);
      assert.equal(formatCurrency(view.result.costPerDayCents / 100), expected.display.cost_per_day, `${name} cost per day text`);
    }
  },
  electricity_rate: {
    run: ({ bill, kwh, fixed }) => runRateCalculator({ bill: text(bill), kwh: text(kwh), fixed: text(fixed) }),
    fields: {},
    check(view, expected, name) {
      close(view.result.averageCentsPerKwh, expected.all_in_cents_per_kwh, EXACT, `${name} average`);
      close(view.result.residualCentsPerKwh, expected.residual_cents_per_kwh, EXACT, `${name} residual`);
      assert.equal(view.averageText, expected.display.all_in, `${name} average text`);
      assert.equal(view.residualText, expected.display.residual, `${name} residual text`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
      assert.equal(RESIDUAL_LABEL, expected.residual_label, `${name} label`);
    }
  },
  ev_cost_per_mile: {
    run: ({ rate, figure_type: type, figure, efficiency, annual_miles: miles }) => runPerMileCalculator({
      rate: text(rate), figureType: type ? FIGURE_TYPES[type] : '', figure: text(figure), efficiency: text(efficiency), annualMiles: text(miles)
    }),
    fields: { figure_type: 'figureType', annual_miles: 'annualMiles' },
    check(view, expected, name) {
      close(view.result.costPerMile, expected.cost_per_mile, EXACT, `${name} per mile`);
      close(view.result.costPer100Miles, expected.cost_per_100mi, EXACT, `${name} per 100 mi`);
      if (expected.mi_per_kwh === null) assert.equal(view.result.milesPerKwh, null, `${name} mi/kWh`);
      else close(view.result.milesPerKwh, expected.mi_per_kwh, EXACT, `${name} mi/kWh`);
      if (expected.annual === null) assert.equal(view.result.annual, null, `${name} annual`);
      else close(view.result.annual, expected.annual, MONEY, `${name} annual`);
      assert.equal(view.perMileText, expected.display.per_mile, `${name} per mile text`);
      assert.equal(view.result.costPerMileHundredthsOfCent, expected.cost_per_mile_hundredths_of_cent, `${name} per mile rounded once`);
      assert.equal(view.result.costPer100MilesCents, expected.cost_per_100mi_cents, `${name} per 100 mi from the rounded per-mile cents`);
      assert.equal(view.result.annualCents, expected.annual_cents, `${name} annual cents`);
      assert.equal(formatCurrency(view.result.costPer100MilesCents / 100), expected.display.per_100mi, `${name} per 100 mi text`);
      if (expected.annual_cents !== null) assert.equal(formatCurrency(view.result.annualCents / 100), expected.display.annual, `${name} annual text`);
      assert.equal(view.milesPerKwhText, expected.display.mi_per_kwh, `${name} mi/kWh text`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
    }
  },
  ev_gas_savings: {
    run: ({ miles, kwh_per_100mi: kwh, rate, mpg, price_per_gallon: price }) => runSavingsCalculator({
      miles: text(miles), kwhPer100Miles: text(kwh), rate: text(rate), mpg: text(mpg), pricePerGallon: text(price)
    }),
    fields: { kwh_per_100mi: 'kwhPer100Miles', price_per_gallon: 'pricePerGallon' },
    check(view, expected, name) {
      close(view.result.evCost, expected.ev_cost, MONEY, `${name} EV`);
      close(view.result.gasCost, expected.gas_cost, MONEY, `${name} gas`);
      close(view.result.savings, expected.savings, MONEY, `${name} savings`);
      close(view.result.savingsPerMonth, expected.savings_per_month, MONEY, `${name} per month`);
      close(view.result.evPerMile, expected.ev_per_mile, EXACT, `${name} EV per mile`);
      close(view.result.gasPerMile, expected.gas_per_mile, EXACT, `${name} gas per mile`);
      assert.equal(view.result.gasCheaper, expected.gas_cheaper, `${name} gas cheaper`);
      assert.equal(view.evPerMileText, expected.display.ev_per_mile, `${name} EV per mile text`);
      assert.equal(view.gasPerMileText, expected.display.gas_per_mile, `${name} gas per mile text`);
      for (const [key, cents, expectedCents] of [['ev_cost', 'evCents', 'ev_cents'], ['gas_cost', 'gasCents', 'gas_cents'], ['savings', 'savingsCents', 'savings_cents'], ['savings_per_month', 'savingsPerMonthCents', 'savings_per_month_cents']]) {
        assert.equal(view.result[cents], expected[expectedCents], `${name} ${key} cents`);
        assert.equal(formatCurrency(view.result[cents] / 100), expected.display[key], `${name} ${key} text`);
      }
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

test('every reference vector is covered', () => {
  assert.equal(VECTORS.length, 74);
  assert.ok(VECTORS.every((vector) => vector.fn in RUNNERS));
});

test('worked examples (master §4.9–4.12 acceptance)', () => {
  const cost = runElectricityCostCalculator({ watts: '200', hours: '4', days: '120', rate: '0.085' }).view;
  assert.equal(cost.kwhText, '96.00 kWh');
  assert.equal(formatCurrency(cost.result.costCents / 100), '$8.16');
  assert.equal(formatKwh(runElectricityCostCalculator({ watts: '1500', hours: '3', days: '30', rate: '0.15' }).view.result.kwh), '135.00 kWh');
  assert.equal(runElectricityCostCalculator({ watts: '125', hours: '24', days: '1', rate: '0.145' }).view.result.costCents, 44, 'half cent rounds up');

  const savings = runSavingsCalculator({ miles: '12000', kwhPer100Miles: '30', rate: '0.15', mpg: '30', pricePerGallon: '3.50' }).view;
  assert.deepEqual([savings.result.evCents, savings.result.gasCents, savings.result.savingsCents].map((c) => formatCurrency(c / 100)), ['$540.00', '$1,400.00', '$860.00']);
  assert.equal(formatCurrency(savings.result.savingsPerMonthCents / 100), '$71.67');
  assert.equal(savings.evPerMileText, '4.50¢ ($0.045)');
  assert.equal(savings.gasPerMileText, '11.67¢ ($0.117)');

  const perMile = runPerMileCalculator({ rate: '0.15', figureType: 'epa', figure: '30', efficiency: '', annualMiles: '12000' }).view;
  assert.equal(perMile.perMileText, '4.50¢ ($0.045)');
  assert.ok(perMile.perMileText.includes('$0.045') && !perMile.perMileText.includes('$0.05)'), '$0.045, not $0.05');
  assert.equal(perMile.milesPerKwhText, '3.33');
  assert.equal(formatCurrency(perMile.result.annualCents / 100), '$540.00');
  assert.equal(runPerMileCalculator({ rate: '0.137', figureType: 'epa', figure: '28', efficiency: '', annualMiles: '' }).view.perMileText, '3.84¢ ($0.038)');

  const rate = runRateCalculator({ bill: '142.50', kwh: '950', fixed: '15.70' }).view;
  assert.equal(rate.averageText, '15.00¢');
  assert.equal(rate.residualText, '13.35¢');
});

test('B2-22: the residual is labelled "Rate after entered exclusions" and nothing says "energy-only"', () => {
  assert.equal(RESIDUAL_LABEL, 'Rate after entered exclusions');
  const view = runRateCalculator({ bill: '142.50', kwh: '950', fixed: '15.70' }).view;
  const markup = String(rateResults(view)) + String(electricityRatePage().body);
  assert.ok(markup.includes('Rate after entered exclusions'));
  assert.ok(!/energy[- ]only/i.test(markup));
  const clamp = runRateCalculator({ bill: '0.02', kwh: '10000000', fixed: '0.01' }).view;
  assert.equal(clamp.residualText, '0.00¢');
});

test('B2-20: efficiency changes the dashboard path only', () => {
  const epa = (efficiency) => runPerMileCalculator({ rate: '0.15', figureType: 'epa', figure: '30', efficiency, annualMiles: '' });
  assert.equal(epa('').ok, true);
  assert.ok('efficiency' in epa('90').errors, 'efficiency with the EPA figure is a field error');
  const dash = (efficiency) => runPerMileCalculator({ rate: '0.15', figureType: 'dashboard', figure: '4', efficiency, annualMiles: '' }).view.result.costPerMile;
  assert.notEqual(dash('90'), dash('80'));
});

test('B2-19: miles below 1 (and 0) is a field error before the Fuel Cost engine', () => {
  for (const miles of ['0', '0.99']) {
    const outcome = runSavingsCalculator({ miles, kwhPer100Miles: '30', rate: '0.15', mpg: '30', pricePerGallon: '3.50' });
    assert.equal(outcome.ok, false);
    assert.ok('miles' in outcome.errors);
  }
  assert.ok('mpg' in runSavingsCalculator({ miles: '12000', kwhPer100Miles: '30', rate: '0.15', mpg: '0.09', pricePerGallon: '3.50' }).errors, 'MPG floor 0.1 (N-M3)');
});

test('exact half-cent ties round up, and per 100 miles never contradicts per mile (N-M1, N-M2)', () => {
  const perMile = (rate, figure, annualMiles = '') => runPerMileCalculator({ rate, figureType: 'epa', figure, efficiency: '', annualMiles }).view;
  assert.equal(formatCurrency(perMile('0.15', '30', '5').result.annualCents / 100), '$0.23');
  assert.equal(perMile('0.301', '85').perMileText, '25.59¢ ($0.256)');
  const tie = perMile('1.035', '65');
  assert.equal(tie.perMileText, '67.28¢ ($0.673)');
  assert.equal(formatCurrency(tie.result.costPer100MilesCents / 100), '$67.28');
  const gas = runSavingsCalculator({ miles: '52330.2', kwhPer100Miles: '17.14', rate: '0.28', mpg: '20', pricePerGallon: '1.5' }).view;
  assert.equal(formatCurrency(gas.result.gasCents / 100), '$3,924.77');
  for (let i = 1; i <= 2000; i += 1) {
    const view = perMile(String(i / 1000), String(1 + (i % 997) / 7).slice(0, 8));
    const cents = view.perMileText.split('¢')[0];
    assert.equal(formatCurrency(view.result.costPer100MilesCents / 100), `$${cents}`, `rate ${i / 1000}`);
  }
});

test('per-mile cents are grouped with thousands separators (N-L4)', () => {
  const view = runPerMileCalculator({ rate: '10', figureType: 'dashboard', figure: '0.1', efficiency: '100', annualMiles: '' }).view;
  assert.equal(view.perMileText, '10,000.00¢ ($100.000)');
});
