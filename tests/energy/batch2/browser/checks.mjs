/**
 * Per-page browser checks for the Home Energy Batch 2 drafts, used by
 * harness.mjs. Expected figures come from the adapters, so the browser
 * result must match what the engine computes at build time.
 */

/* global document -- waitForFunction() callbacks run in the browser. */
import assert from 'node:assert/strict';
import { formatCurrency } from '../../../../src/lib/format.js';
import { electricityCostPage } from '../../../../src/pages/energy/electricity-cost-calculator.js';
import { runElectricityCostCalculator, ELECTRICITY_COST_DEFAULTS } from '../../../../src/adapters/energy/electricity-cost.js';
import { electricityRatePage } from '../../../../src/pages/energy/electricity-rate-calculator.js';
import { runRateCalculator, RATE_DEFAULTS } from '../../../../src/adapters/energy/electricity-rate.js';
import { evCostPerMilePage } from '../../../../src/pages/energy/ev-cost-per-mile-calculator.js';
import { runPerMileCalculator, PER_MILE_EXAMPLE } from '../../../../src/adapters/energy/ev-cost-per-mile.js';
import { evGasSavingsPage } from '../../../../src/pages/energy/ev-gas-savings-calculator.js';
import { runSavingsCalculator, SAVINGS_DEFAULTS } from '../../../../src/adapters/energy/ev-gas-savings.js';

const primary = async (page) => (await page.locator('.stat--primary .stat__value').first().textContent()).trim();
const until = async (page, expected) => {
  await page.waitForFunction((text) => document.querySelector('.stat--primary .stat__value')?.textContent.trim() === text, expected);
  return primary(page);
};
const costText = (values) => formatCurrency(runElectricityCostCalculator(values).view.result.costCents / 100);

export const DRAFT_CHECKS = [
  {
    render: electricityCostPage,
    firstInput: '#elcost-watts',
    example: costText(ELECTRICITY_COST_DEFAULTS),
    async interact(page) {
      await page.fill('#elcost-hours', '8');
      const expected = costText({ ...ELECTRICITY_COST_DEFAULTS, hours: '8' });
      assert.equal(await until(page, expected), expected);
      await page.fill('#elcost-watts', '125');
      await page.fill('#elcost-hours', '24');
      await page.fill('#elcost-days', '1');
      await page.fill('#elcost-rate', '0.145');
      assert.equal(await until(page, '$0.44'), '$0.44', 'an exact half cent rounds up');
    },
    invalid: { input: '#elcost-rate', value: '16', message: /dollars per kWh, for example 0\.16/, recover: '0.15' }
  },
  {
    render: electricityRatePage,
    firstInput: '#elrate-bill',
    example: runRateCalculator(RATE_DEFAULTS).view.averageText,
    async interact(page) {
      await page.fill('#elrate-kwh', '1000');
      const expected = runRateCalculator({ ...RATE_DEFAULTS, kwh: '1000' }).view.averageText;
      assert.equal(await until(page, expected), expected);
      const residual = runRateCalculator({ ...RATE_DEFAULTS, kwh: '1000' }).view.residualText;
      await page.waitForFunction((text) => document.getElementById('calc-results-body')?.textContent.includes(text), residual);
      assert.ok((await page.locator('#calc-results-body').textContent()).includes('Rate after entered exclusions'));
    },
    invalid: { input: '#elrate-fixed', value: '200', message: /cannot be more than the bill total/, recover: '15.70' }
  },
  {
    render: evCostPerMilePage,
    firstInput: '#permile-rate',
    example: runPerMileCalculator(PER_MILE_EXAMPLE).view.perMileText,
    async interact(page) {
      // No figure type is preselected (C-M3): the user chooses it.
      await page.locator('#permile-figure-type').check();
      await page.fill('#permile-rate', '0.137');
      await page.fill('#permile-figure', '28');
      assert.equal(await until(page, '3.84¢ ($0.038)'), '3.84¢ ($0.038)');
      await page.locator('#permile-figure-type-dashboard').check();
      await page.fill('#permile-figure', '4');
      await page.fill('#permile-efficiency', '90');
      const dashboard = runPerMileCalculator({ ...PER_MILE_EXAMPLE, rate: '0.137', figureType: 'dashboard', figure: '4', efficiency: '90' }).view.perMileText;
      assert.equal(await until(page, dashboard), dashboard);
    },
    invalid: { input: '#permile-rate', value: '15', message: /dollars per kWh, for example 0\.16/, recover: '0.15' }
  },
  {
    render: evGasSavingsPage,
    firstInput: '#evgas-miles',
    example: formatCurrency(runSavingsCalculator(SAVINGS_DEFAULTS).view.result.savings),
    async interact(page) {
      await page.fill('#evgas-price', '4.00');
      const expected = formatCurrency(runSavingsCalculator({ ...SAVINGS_DEFAULTS, pricePerGallon: '4.00' }).view.result.savings);
      assert.equal(await until(page, expected), expected);
      await page.fill('#evgas-rate', '0.60');
      await page.fill('#evgas-mpg', '50');
      await page.fill('#evgas-price', '2');
      const negative = formatCurrency(runSavingsCalculator({ ...SAVINGS_DEFAULTS, rate: '0.60', mpg: '50', pricePerGallon: '2' }).view.result.savings);
      assert.equal(await until(page, negative), negative);
      assert.ok((await page.locator('#calc-results-body').textContent()).includes('the gas vehicle is cheaper to fuel'));
    },
    invalid: { input: '#evgas-miles', value: '0.5', message: /at least 1/, recover: '12000' }
  }
];
