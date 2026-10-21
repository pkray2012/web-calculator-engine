/**
 * Per-page browser checks for the Home Energy Batch 1 drafts, used by
 * harness.mjs. Expected figures come from the adapters, so the browser
 * result must match what the engine computes at build time.
 */

/* global document -- waitForFunction() callbacks run in the browser. */
import assert from 'node:assert/strict';
import { formatCurrency } from '../../../../src/lib/format.js';
import { utilityCostPage } from '../../../../src/pages/energy/utility-cost-calculator.js';
import { runUtilityCalculator, UTILITY_DEFAULTS } from '../../../../src/adapters/energy/utility-cost.js';
import { solarPricePerWattPage } from '../../../../src/pages/energy/solar-price-per-watt-calculator.js';
import { runPpwCalculator, PPW_DEFAULTS } from '../../../../src/adapters/energy/solar-price-per-watt.js';
import { electricBillPage } from '../../../../src/pages/energy/electric-bill-calculator.js';
import { runBillCalculator, BILL_DEFAULTS } from '../../../../src/adapters/energy/electric-bill.js';
import { solarPaybackPage } from '../../../../src/pages/energy/solar-payback-calculator.js';
import { runPaybackCalculator, PAYBACK_DEFAULTS } from '../../../../src/adapters/energy/solar-payback.js';

const primary = async (page) => (await page.locator('.stat--primary .stat__value').first().textContent()).trim();
const until = async (page, expected) => {
  await page.waitForFunction((text) => document.querySelector('.stat--primary .stat__value')?.textContent.trim() === text, expected);
  return primary(page);
};

export const DRAFT_CHECKS = [
  {
    render: utilityCostPage,
    firstInput: '#utility-electricity',
    example: formatCurrency(runUtilityCalculator(UTILITY_DEFAULTS).view.result.monthly),
    async interact(page) {
      await page.fill('#utility-internet', '65.50');
      const expected = formatCurrency(runUtilityCalculator({ ...UTILITY_DEFAULTS, internet: '65.50' }).view.result.monthly);
      assert.equal(await until(page, expected), expected);
      assert.ok((await page.locator('#utility-shares').textContent()).includes('Internet'));
    },
    invalid: { input: '#utility-gas', value: '60.001', message: /dollars and cents/, recover: '60' }
  },
  {
    render: solarPricePerWattPage,
    firstInput: '#ppw-price',
    example: runPpwCalculator(PPW_DEFAULTS).view.gross,
    async interact(page) {
      await page.fill('#ppw-incentives', '2000');
      const expected = runPpwCalculator({ ...PPW_DEFAULTS, incentives: '2000' }).view.net;
      assert.equal(await until(page, expected), expected);
      await page.locator('#ppw-unit-w').check();
      await page.fill('#ppw-size', '6400');
      const watts = runPpwCalculator({ ...PPW_DEFAULTS, incentives: '2000', unit: 'W', size: '6400' }).view.net;
      assert.equal(await until(page, watts), watts);
    },
    invalid: { input: '#ppw-incentives', value: '30000', message: /cannot be more than the installed price/, recover: '0' }
  },
  {
    render: electricBillPage,
    firstInput: '#bill-kwh',
    example: formatCurrency(runBillCalculator(BILL_DEFAULTS).view.result.bill),
    async interact(page) {
      await page.fill('#bill-kwh', '1200');
      const expected = formatCurrency(runBillCalculator({ ...BILL_DEFAULTS, kwh: '1200' }).view.result.bill);
      assert.equal(await until(page, expected), expected);
    },
    invalid: { input: '#bill-rate', value: '16', message: /dollars per kWh, for example 0\.16/, recover: '0.16' }
  },
  {
    render: solarPaybackPage,
    firstInput: '#payback-cost',
    example: runPaybackCalculator(PAYBACK_DEFAULTS).view.display,
    async interact(page) {
      await page.fill('#payback-maintenance', '100');
      const expected = runPaybackCalculator({ ...PAYBACK_DEFAULTS, maintenance: '100' }).view.display;
      assert.equal(await until(page, expected), expected);
      await page.fill('#payback-maintenance', '1600');
      const undefinedPayback = runPaybackCalculator({ ...PAYBACK_DEFAULTS, maintenance: '1600' }).view.display;
      assert.equal(await until(page, undefinedPayback), undefinedPayback);
    },
    invalid: { input: '#payback-incentives', value: '20000.01', message: /cannot be more than the installed cost/, recover: '' }
  }
];
