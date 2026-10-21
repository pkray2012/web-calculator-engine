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
import { solarBatteryChargeTimePage, BATTERY_EXAMPLE } from '../../../../src/pages/energy/solar-battery-charge-time-calculator.js';
import { evChargingTimePage, EV_TIME_EXAMPLE } from '../../../../src/pages/energy/ev-charging-time-calculator.js';
import { runBatteryCalculator, runEvTimeCalculator, EV_TIME_DEFAULTS } from '../../../../src/adapters/energy/charging-time.js';
import { evChargingCostPage, EV_COST_EXAMPLE } from '../../../../src/pages/energy/ev-charging-cost-calculator.js';
import { runEvCostCalculator } from '../../../../src/adapters/energy/ev-charging-cost.js';
import { solarFinancingPage } from '../../../../src/pages/energy/solar-financing-calculator.js';
import { runFinancingCalculator, FINANCING_DEFAULTS } from '../../../../src/adapters/energy/solar-financing.js';

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
  },
  {
    render: solarBatteryChargeTimePage,
    firstInput: '#battery-capacity',
    example: runBatteryCalculator(BATTERY_EXAMPLE).view.timeText,
    async interact(page) {
      // No measurement point is preselected: typing alone asks for one.
      await page.fill('#battery-power', '2');
      await page.waitForFunction(() => document.getElementById('calc-results')?.dataset.state === 'stale');
      assert.match(await page.locator('#results-status').textContent(), /where the charging power is measured/);
      await page.locator('#battery-basis-battery').check();
      const battery = runBatteryCalculator({ ...BATTERY_EXAMPLE, power: '2' }).view.timeText;
      assert.equal(await until(page, battery), battery);
      await page.locator('#battery-basis').check();
      await page.fill('#battery-efficiency', '90');
      const wall = runBatteryCalculator({ ...BATTERY_EXAMPLE, power: '2', basis: 'wall', efficiency: '90' }).view.timeText;
      assert.equal(await until(page, wall), wall);
    },
    invalid: { input: '#battery-target', value: '20', message: /cannot be below the starting level/, recover: '100' }
  },
  {
    render: evChargingTimePage,
    firstInput: '#evtime-capacity',
    example: runEvTimeCalculator(EV_TIME_EXAMPLE).view.timeText,
    async interact(page) {
      await page.locator('#evtime-basis').check();
      await page.fill('#evtime-efficiency', '90');
      await page.fill('#evtime-vehicle-max', '6.6');
      const capped = runEvTimeCalculator({ ...EV_TIME_DEFAULTS, basis: 'wall', efficiency: '90', vehicleMax: '6.6' }).view.timeText;
      assert.equal(await until(page, capped), capped);
      assert.ok((await page.locator('#calc-results-body').textContent()).includes('maximum AC rate'));
    },
    invalid: { input: '#evtime-efficiency', value: '101', message: /100 or less/, recover: '90' }
  },
  {
    render: evChargingCostPage,
    firstInput: '#evcost-capacity',
    example: formatCurrency(runEvCostCalculator(EV_COST_EXAMPLE).view.result.costPerCharge),
    async interact(page) {
      await page.fill('#evcost-efficiency', '90');
      await page.fill('#evcost-rate', '0.20');
      const expected = formatCurrency(runEvCostCalculator({ ...EV_COST_EXAMPLE, rate: '0.20' }).view.result.costPerCharge);
      assert.equal(await until(page, expected), expected);
      await page.locator('#evcost-figure-type-epa').check();
      await page.fill('#evcost-figure', '30');
      const perMile = runEvCostCalculator({ ...EV_COST_EXAMPLE, rate: '0.20', figureType: 'epa', figure: '30' }).view.perMileText;
      await page.waitForFunction((text) => document.getElementById('calc-results-body')?.textContent.includes(text), perMile);
    },
    invalid: { input: '#evcost-rate', value: '15', message: /dollars per kWh, for example 0\.16/, recover: '0.15' }
  },
  {
    render: solarFinancingPage,
    firstInput: '#fin-price',
    example: formatCurrency(runFinancingCalculator(FINANCING_DEFAULTS).view.result.payment),
    async interact(page) {
      await page.fill('#fin-purchase-rebates', '1000');
      const expected = formatCurrency(runFinancingCalculator({ ...FINANCING_DEFAULTS, purchaseRebates: '1000' }).view.result.payment);
      assert.equal(await until(page, expected), expected);
      await page.fill('#fin-term', '30');
      await page.selectOption('#fin-term-unit', 'years');
      const years = formatCurrency(runFinancingCalculator({ ...FINANCING_DEFAULTS, purchaseRebates: '1000', term: '30', termUnit: 'years' }).view.result.payment);
      assert.equal(await until(page, years), years);
      await page.fill('#fin-down', '19000');
      assert.equal(await until(page, formatCurrency(0)), formatCurrency(0), 'down payment and rebates covering the price need no loan');
    },
    invalid: { input: '#fin-rate', value: '89.48', message: /25 or less/, recover: '7' }
  }
];
