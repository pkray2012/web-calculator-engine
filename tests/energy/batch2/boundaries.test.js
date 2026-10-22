/**
 * R03 v3.1 §0.5 standard boundary set (with the v3.2 Batch 2 limits) through
 * each Batch 2 adapter, for every numeric field: the outcome is a field error
 * on that field or a finite result, never an exception, NaN or Infinity.
 * Also the engine-level finite guards (§0.3).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runElectricityCostCalculator, ELECTRICITY_COST_DEFAULTS } from '../../../src/adapters/energy/electricity-cost.js';
import { runRateCalculator, RATE_DEFAULTS } from '../../../src/adapters/energy/electricity-rate.js';
import { runPerMileCalculator, PER_MILE_DEFAULTS } from '../../../src/adapters/energy/ev-cost-per-mile.js';
import { runSavingsCalculator, SAVINGS_DEFAULTS } from '../../../src/adapters/energy/ev-gas-savings.js';
import { calculateElectricityCost } from '../../../src/calculators/energy/electricity-cost.js';
import { calculateElectricityRate } from '../../../src/calculators/energy/electricity-rate.js';
import { calculateEvCostPerMile } from '../../../src/calculators/energy/ev-cost-per-mile.js';
import { calculateEvGasSavings, SavingsError } from '../../../src/calculators/energy/ev-gas-savings.js';

const TINY = `0.${'0'.repeat(320)}1`;
const HUGE = `1${'0'.repeat(308)}`;
const NINES = '9'.repeat(309);

/** The §0.5 strings for a field with the given min and max, display unit and whether 0 is allowed. */
function boundarySet({ min, max, unit }) {
  return [String(min), String(+(min - unit).toFixed(10)), String(max), String(+(max + unit).toFixed(10)), '0', '-0', '-1', '', 'abc',
    'Infinity', '1e308', TINY, HUGE, NINES, '$1,000', '6.5%', '2,5'];
}

/** Every number reachable in a view's result must be finite. */
function assertFinite(value, path) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} = ${value}`);
  else if (value && typeof value === 'object') for (const [key, inner] of Object.entries(value)) assertFinite(inner, `${path}.${key}`);
}

const PAGES = [
  { name: 'electricity cost', run: runElectricityCostCalculator, defaults: ELECTRICITY_COST_DEFAULTS, fields: {
    watts: { min: 0.01, max: 1_000_000, unit: 0.01 }, hours: { min: 0, max: 24, unit: 0.01 }, days: { min: 1, max: 366, unit: 1 }, rate: { min: 0, max: 10, unit: 0.0001 }
  } },
  // A bill below the default exclusions is a cross-field error on the exclusions, so the bill and kWh run without them.
  { name: 'electricity rate', run: runRateCalculator, defaults: { ...RATE_DEFAULTS, fixed: '' }, fields: {
    bill: { min: 0.01, max: 1_000_000, unit: 0.01 }, kwh: { min: 1, max: 10_000_000, unit: 0.01 }
  } },
  { name: 'electricity rate (exclusions)', run: runRateCalculator, defaults: RATE_DEFAULTS, fields: {
    fixed: { min: 0, max: 142.5, unit: 0.01 }
  } },
  { name: 'EV cost per mile (EPA)', run: runPerMileCalculator, defaults: PER_MILE_DEFAULTS, fields: {
    rate: { min: 0, max: 10, unit: 0.0001 }, figure: { min: 1, max: 1000, unit: 0.01 }, annualMiles: { min: 0, max: 1_000_000, unit: 1 }
  } },
  { name: 'EV cost per mile (dashboard)', run: runPerMileCalculator, defaults: { ...PER_MILE_DEFAULTS, figureType: 'dashboard', figure: '4', efficiency: '90' }, fields: {
    figure: { min: 0.1, max: 100, unit: 0.01 }, efficiency: { min: 1, max: 100, unit: 0.01 }
  } },
  { name: 'EV gas savings', run: runSavingsCalculator, defaults: SAVINGS_DEFAULTS, fields: {
    miles: { min: 0.01, max: 1_000_000, unit: 0.01 }, kwhPer100Miles: { min: 1, max: 1000, unit: 0.01 }, rate: { min: 0, max: 10, unit: 0.0001 },
    mpg: { min: 0.01, max: 500, unit: 0.01 }, pricePerGallon: { min: 0.01, max: 50, unit: 0.01 }
  } }
];

for (const { name, run, defaults, fields } of PAGES) {
  test(`${name}: R03 §0.5 boundary set on every numeric field`, () => {
    for (const [field, limits] of Object.entries(fields)) {
      for (const value of boundarySet(limits)) {
        let outcome;
        assert.doesNotThrow(() => { outcome = run({ ...defaults, [field]: value }); }, `${field}=${value.slice(0, 20)}`);
        if (outcome.ok) assertFinite(outcome.view.result, `${field}=${value.slice(0, 20)}`);
        else assert.ok(field in outcome.errors, `${field}=${value.slice(0, 20)}: errors on ${Object.keys(outcome.errors)}`);
      }
      // Limits: min and max accepted, one display unit beyond rejected (blank is allowed for optional fields).
      assert.equal(run({ ...defaults, [field]: String(limits.max) }).ok, true, `${field} max`);
      assert.equal(run({ ...defaults, [field]: String(+(limits.max + limits.unit).toFixed(10)) }).ok, false, `${field} max + 1 unit`);
    }
  });
}

test('B2-1: hours 0 gives 0 kWh and $0.00; days 30.5 is rejected', () => {
  const view = runElectricityCostCalculator({ ...ELECTRICITY_COST_DEFAULTS, hours: '0' }).view;
  assert.equal(view.kwhText, '0.00 kWh');
  assert.equal(view.result.costCents, 0);
  assert.ok('days' in runElectricityCostCalculator({ ...ELECTRICITY_COST_DEFAULTS, days: '30.5' }).errors);
  assert.match(runElectricityCostCalculator({ ...ELECTRICITY_COST_DEFAULTS, rate: '16' }).errors.rate, /0\.16 for 16¢/);
});

test('B2-22: exclusions equal to the bill give 0.00¢ with the note; more than the bill is a field error', () => {
  const view = runRateCalculator({ bill: '142.50', kwh: '950', fixed: '142.50' }).view;
  assert.equal(view.residualText, '0.00¢');
  assert.ok(view.notes.some((note) => note.startsWith('Everything on the bill')));
  assert.ok('fixed' in runRateCalculator({ bill: '142.50', kwh: '950', fixed: '142.51' }).errors);
  assert.match(runRateCalculator({ bill: '142.505', kwh: '950', fixed: '' }).errors.bill, /dollars and cents/);
});

test('engine finite guards: extreme or invalid numbers throw RangeError, never return NaN or Infinity', () => {
  for (const bad of [1e308, 5e-324, NaN, 1e308 + 1e308, 0 / 0]) {
    assert.throws(() => calculateElectricityCost({ watts: bad, hours: 4, days: 30, rate: 0.15 }), RangeError);
    assert.throws(() => calculateElectricityRate({ billCents: 100, kwh: bad }), RangeError);
    assert.throws(() => calculateEvCostPerMile({ rate: 0.15, figureType: 'dashboard', figure: bad, efficiencyPercent: 90 }), RangeError);
    assert.throws(() => calculateEvGasSavings({ miles: 12000, kwhPer100Miles: 30, rate: 0.15, mpg: bad === 5e-324 ? Infinity : bad, pricePerGallon: 3.5 }), SavingsError);
  }
  assert.throws(() => calculateEvGasSavings({ miles: 1_000_000, kwhPer100Miles: 1000, rate: 10, mpg: 5e-324, pricePerGallon: 50 }), SavingsError, 'tiny MPG overflows the gas cost');
  assert.throws(() => calculateEvGasSavings({ miles: 0, kwhPer100Miles: 30, rate: 0.15, mpg: 30, pricePerGallon: 3.5 }), SavingsError, 'miles 0 never reaches the Fuel Cost engine');
});
