/**
 * Regressions for the 2026-10-21 read-only audit of the Batch 1 drafts
 * (displayed results, field messages against the content spec, sources and copy).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EV_COST_DEFAULTS, runEvCostCalculator } from '../../../src/adapters/energy/ev-charging-cost.js';
import { evCostResults } from '../../../src/components/energy/ev-charging-cost-results.js';
import { EV_TIME_DEFAULTS, BATTERY_DEFAULTS, runEvTimeCalculator, runBatteryCalculator } from '../../../src/adapters/energy/charging-time.js';
import { FINANCING_DEFAULTS, runFinancingCalculator } from '../../../src/adapters/energy/solar-financing.js';
import { BILL_DEFAULTS, RATE_HINT, runBillCalculator } from '../../../src/adapters/energy/electric-bill.js';
import { billResults } from '../../../src/components/energy/electric-bill-results.js';
import { formatPayback } from '../../../src/adapters/energy/solar-payback.js';
import { PPW_DEFAULTS, runPpwCalculator } from '../../../src/adapters/energy/solar-price-per-watt.js';
import { ppwResults } from '../../../src/components/energy/solar-price-per-watt-results.js';
import { scheduleInvariantFailures } from '../../../src/calculators/energy/solar-financing.js';
import { ENERGY_SOURCES } from '../../../src/content/energy-sources.js';
import { solarPricePerWattPage } from '../../../src/pages/energy/solar-price-per-watt-calculator.js';
import { solarPaybackPage } from '../../../src/pages/energy/solar-payback-calculator.js';
import { solarFinancingPage } from '../../../src/pages/energy/solar-financing-calculator.js';

const evCost = { ...EV_COST_DEFAULTS, efficiency: '90' };

test('the EV charging rate is echoed as entered, not rounded to cents', () => {
  const run = runEvCostCalculator({ ...evCost, rate: '0.137' });
  assert.ok(run.ok);
  assert.match(String(evCostResults(run.view)), /at \$0\.137 per kWh/);
});

test('start-level errors use each form\'s visible label', () => {
  assert.equal(runEvCostCalculator({ ...evCost, startLevel: '' }).errors.startLevel, 'Start charge level is required.');
  assert.equal(runEvTimeCalculator({ ...EV_TIME_DEFAULTS, basis: 'battery', startLevel: '' }).errors.startLevel, 'Start charge level is required.');
  assert.equal(runBatteryCalculator({ ...BATTERY_DEFAULTS, basis: 'battery', startLevel: '' }).errors.startLevel, 'Current charge level is required.');
});

test('a figure without a figure type asks for the type, whatever the figure', () => {
  const run = runEvCostCalculator({ ...evCost, figure: '0.5' });
  assert.deepEqual(run.errors, { figureType: 'Choose the figure type (EPA kWh/100 mi or dashboard mi/kWh).' });
  assert.match(runEvCostCalculator({ ...evCost, figureType: 'epa', figure: '' }).errors.figure, /^Figure value /);
});

test('later-rebates errors use the field\'s label', () => {
  assert.match(runFinancingCalculator({ ...FINANCING_DEFAULTS, laterRebates: 'abc' }).errors.laterRebates, /^Rebates or incentives received later /);
});

test('a rate typed with a cent sign gets the dollars hint', () => {
  assert.equal(runBillCalculator({ ...BILL_DEFAULTS, rate: '16¢' }).errors.rate, `Energy rate must be a number. ${RATE_HINT}`);
  assert.equal(runEvCostCalculator({ ...evCost, rate: '16¢' }).errors.rate, `Electricity rate must be a number. ${RATE_HINT}`);
});

test('below 1 kWh the average cost per kWh shows a dash (X3)', () => {
  const run = runBillCalculator({ ...BILL_DEFAULTS, kwh: '0.5' });
  assert.match(String(billResults(run.view)), /Average cost per kWh[\s\S]*?—/);
});

test('payback text uses singular units', () => {
  assert.equal(formatPayback(1.25), '1.3 years (1 year 3 months)');
  assert.equal(formatPayback(1 / 12), '0.1 years (0 years 1 month)');
  assert.equal(formatPayback(2.5), '2.5 years (2 years 6 months)');
});

test('a kW size is echoed as entered', () => {
  const run = runPpwCalculator({ ...PPW_DEFAULTS, size: '0.0015', unit: 'kW' });
  assert.ok(run.ok);
  assert.match(String(ppwResults(run.view)), /0\.0015 kW × 1,000/);
  assert.doesNotMatch(String(ppwResults(runPpwCalculator({ ...PPW_DEFAULTS, size: '1234.5678', unit: 'W' }).view)), /As entered/);
});

test('no tax-credit wording and no "never" on the solar pages', () => {
  for (const page of [solarPricePerWattPage, solarPaybackPage, solarFinancingPage]) {
    const body = String(page().body);
    assert.doesNotMatch(body, /tax credit/i);
    assert.doesNotMatch(body, /\bnever\b/i);
  }
});

test('the E6 citation names the actual document', () => {
  assert.match(ENERGY_SOURCES.simplePayback.title, /^Simple Photovoltaic Economic Calculations/);
  assert.match(ENERGY_SOURCES.simplePayback.publisher, /National Renewable Energy Laboratory/);
});

test('the E8 and E7 citations use the live EPA download page and the current AFDC title', () => {
  assert.equal(ENERGY_SOURCES.epaLabelLosses.url, 'https://www.epa.gov/automotive-trends/download-2024-automotive-trends-report');
  assert.equal(ENERGY_SOURCES.homeCharging.title, 'Charging Electric Vehicles at Home');
});

test('the Price Per Watt page cites E5 for the DC rating', () => {
  const body = String(solarPricePerWattPage().body);
  assert.ok(body.includes(ENERGY_SOURCES.dcRating.url));
  assert.equal(ENERGY_SOURCES.dcRating.url, 'https://atb.nlr.gov/electricity/2024/residential_pv');
});

test('Electric Bill shows exact half cents rounded up, not one cent low (Codex 07:04)', () => {
  const show = (kwh, rate, fixed) => String(billResults(runBillCalculator({ ...BILL_DEFAULTS, kwh, rate, fixed }).view));
  assert.match(show('3', '0.145', '0'), /\$0\.44/);
  assert.doesNotMatch(show('3', '0.145', '0'), /\$0\.43/);
  assert.match(show('3', '0.145', '0'), /\$5\.28/, '12 × the rounded bill');
  assert.match(show('78', '0.0225', '12'), /\$13\.76/);
  // Whole kWh × a rate with up to four decimals: compare with integer arithmetic.
  for (let k = 1; k <= 30; k += 1) {
    for (let t = 1; t <= 2000; t += 7) {
      const rate = (t / 10000).toString();
      const expectedCents = Math.floor((2 * k * t + 100) / 200);
      const run = runBillCalculator({ ...BILL_DEFAULTS, kwh: String(k), rate, fixed: '0' });
      assert.equal(run.view.result.billCents, expectedCents, `${k} kWh × $${rate}`);
    }
  }
});

test('the final-balance invariant fails a negative or non-finite balance (Codex 14:03)', () => {
  const ledger = (balance) => ({ loan: 100, payment: 100, termMonths: 1, schedule: [{ payment: 100, principal: 100, interest: 0, balance }] });
  assert.deepEqual(scheduleInvariantFailures(ledger(0)), []);
  assert.deepEqual(scheduleInvariantFailures(ledger(0.004)), []);
  for (const balance of [-0.006, -1_000_000, -Infinity, Infinity, NaN, 0.006]) {
    assert.ok(scheduleInvariantFailures(ledger(balance)).includes('2 balance'), String(balance));
  }
});
