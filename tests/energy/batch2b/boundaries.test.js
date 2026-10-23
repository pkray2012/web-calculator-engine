/**
 * R03 v3.1 §0.5 standard boundary set (with the Batch 2b limits of spec r8.1)
 * through each Batch 2b adapter, for every numeric field: the outcome is a
 * field error on that field or a finite result, never an exception, NaN or
 * Infinity. Also the engine-level guards and the exact-ratio helpers.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runRoiCalculator, ROI_DEFAULTS } from '../../../src/adapters/energy/solar-roi.js';
import { runSolarSavingsCalculator, SOLAR_SAVINGS_EXAMPLE } from '../../../src/adapters/energy/solar-savings.js';
import { runSizeCalculator, SIZE_EXAMPLE } from '../../../src/adapters/energy/solar-panel-size.js';
import { runOutputCalculator, OUTPUT_EXAMPLE } from '../../../src/adapters/energy/solar-panel-output.js';
import { calculateSolarRoi } from '../../../src/calculators/energy/solar-roi.js';
import { calculateSolarSavings } from '../../../src/calculators/energy/solar-savings.js';
import { calculateSolarPanelSize } from '../../../src/calculators/energy/solar-panel-size.js';
import { calculateSolarPanelOutput } from '../../../src/calculators/energy/solar-panel-output.js';
import { exactRatio, roundRatioSigned, ceilRatio, subtractRatios, divideRatios } from '../../../src/lib/energy/money.js';
import { ratioDecimal, formatKwhRatio } from '../../../src/lib/energy/format.js';

const TINY = `0.${'0'.repeat(320)}1`;
const HUGE = `1${'0'.repeat(308)}`;
const NINES = '9'.repeat(309);

function boundarySet({ min, max, unit }) {
  return [String(min), String(+(min - unit).toFixed(10)), String(max), String(+(max + unit).toFixed(10)), '0', '-0', '-1', '', 'abc',
    'Infinity', '1e308', TINY, HUGE, NINES, '$1,000', '6.5%', '2,5'];
}

function assertFinite(value, path) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} = ${value}`);
  else if (value && typeof value === 'object' && typeof value.n !== 'bigint') for (const [key, inner] of Object.entries(value)) assertFinite(inner, `${path}.${key}`);
}

const PAGES = [
  { name: 'solar ROI', run: runRoiCalculator, defaults: ROI_DEFAULTS, fields: {
    cost: { min: 0.01, max: 100_000_000, unit: 0.01 }, incentives: { min: 0, max: 20_000, unit: 0.01 }, savings: { min: 0, max: 100_000_000, unit: 0.01 },
    maintenance: { min: 0, max: 100_000_000, unit: 0.01 }, years: { min: 1, max: 50, unit: 1 }
  } },
  { name: 'solar savings', run: runSolarSavingsCalculator, defaults: SOLAR_SAVINGS_EXAMPLE, fields: {
    production: { min: 0, max: 10_000_000, unit: 0.01 }, selfUse: { min: 0, max: 100, unit: 0.01 }, retailRate: { min: 0, max: 10, unit: 0.0001 },
    exportRate: { min: 0, max: 10, unit: 0.0001 }, fees: { min: 0, max: 1_000_000, unit: 0.01 }
  } },
  { name: 'solar panel size', run: runSizeCalculator, defaults: SIZE_EXAMPLE, fields: {
    annualKwh: { min: 1, max: 10_000_000, unit: 0.01 }, sunHours: { min: 0.1, max: 24, unit: 0.01 }, losses: { min: 0, max: 99, unit: 0.01 },
    panelWatts: { min: 1, max: 2000, unit: 0.01 }
  } },
  { name: 'solar panel output', run: runOutputCalculator, defaults: OUTPUT_EXAMPLE, fields: {
    sizeKw: { min: 0.001, max: 1000, unit: 0.001 }, sunHours: { min: 0.1, max: 24, unit: 0.01 }, losses: { min: 0, max: 99, unit: 0.01 }
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
      assert.equal(run({ ...defaults, [field]: String(limits.max) }).ok, true, `${field} max`);
      assert.equal(run({ ...defaults, [field]: String(+(limits.max + limits.unit).toFixed(10)) }).ok, false, `${field} max + 1 unit`);
    }
  });
}

test('engine guards: out-of-range or non-finite input throws RangeError, never returns NaN or Infinity', () => {
  for (const bad of [NaN, Infinity, -1, 1e308]) {
    assert.throws(() => calculateSolarSavings({ production: bad, selfUse: 60, retailRate: 0.16, exportRate: 0.05 }), RangeError);
    assert.throws(() => calculateSolarPanelSize({ annualKwh: 10800, sunHours: bad, losses: 14 }), RangeError);
    assert.throws(() => calculateSolarPanelOutput({ sizeKw: 7.6, sunHours: 4.5, losses: bad }), RangeError);
  }
  assert.throws(() => calculateSolarPanelSize({ annualKwh: 10800, sunHours: 4.5, losses: 100 }), RangeError, 'losses of 100% would divide by zero');
  assert.throws(() => calculateSolarRoi({ costCents: 0, savingsCents: 1, maintenanceCents: 0, years: 1 }), RangeError);
  assert.throws(() => calculateSolarRoi({ costCents: 100, incentivesCents: 101, savingsCents: 1, maintenanceCents: 0, years: 1 }), RangeError);
  assert.throws(() => calculateSolarRoi({ costCents: 100, savingsCents: 1, maintenanceCents: 0, years: 2.5 }), RangeError);
});

test('exact-ratio helpers: signed rounding, ceiling and display', () => {
  assert.equal(roundRatioSigned({ n: -895n, d: 100n }), -9, '-8.95 rounds away from zero');
  assert.equal(roundRatioSigned({ n: -1n, d: 3n }, 2), -33);
  assert.equal(ceilRatio({ n: 10n, d: 1n }), 10, 'an exact whole number is not rounded up');
  assert.equal(ceilRatio({ n: 101n, d: 10n }), 11);
  assert.equal(ratioDecimal({ n: 894615n, d: 1000n }, 2), '894.62');
  assert.equal(ratioDecimal({ n: -1n, d: 1000n }, 2), '0.00', 'no "-0.00"');
  assert.equal(ratioDecimal({ n: -4999999999999990n, d: 1n }, 1), '-4,999,999,999,999,990.0');
  assert.equal(formatKwhRatio({ n: 0n, d: 1n }), '0.00 kWh');
  assert.equal(formatKwhRatio({ n: 1n, d: 201n }), 'less than 0.01 kWh');
  assert.equal(formatKwhRatio({ n: 1n, d: 200n }), '0.01 kWh', 'exactly 0.005 kWh rounds up to 0.01');
  assert.deepEqual(subtractRatios({ n: 1n, d: 1n }, exactRatio([14], [100])), { n: 86n, d: 100n });
  assert.throws(() => divideRatios({ n: 1n, d: 1n }, { n: 0n, d: 1n }), RangeError);
});
