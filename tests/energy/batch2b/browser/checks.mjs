/**
 * Per-page browser checks for the Home Energy Batch 2b drafts, used by
 * harness.mjs. Expected figures come from the adapters, so the browser
 * result must match what the engine computes at build time.
 */

/* global document -- waitForFunction() callbacks run in the browser. */
import assert from 'node:assert/strict';
import { solarRoiPage } from '../../../../src/pages/energy/solar-roi-calculator.js';
import { runRoiCalculator, ROI_DEFAULTS } from '../../../../src/adapters/energy/solar-roi.js';
import { solarSavingsPage } from '../../../../src/pages/energy/solar-savings-calculator.js';
import { runSolarSavingsCalculator, SOLAR_SAVINGS_EXAMPLE } from '../../../../src/adapters/energy/solar-savings.js';
import { solarPanelSizePage } from '../../../../src/pages/energy/solar-panel-size-calculator.js';
import { runSizeCalculator, SIZE_EXAMPLE } from '../../../../src/adapters/energy/solar-panel-size.js';
import { solarPanelOutputPage } from '../../../../src/pages/energy/solar-panel-output-calculator.js';
import { runOutputCalculator, OUTPUT_EXAMPLE } from '../../../../src/adapters/energy/solar-panel-output.js';

const primary = async (page) => (await page.locator('.stat--primary .stat__value').first().textContent()).trim();
const until = async (page, expected) => {
  await page.waitForFunction((text) => document.querySelector('.stat--primary .stat__value')?.textContent.trim() === text, expected);
  return primary(page);
};

export const DRAFT_CHECKS = [
  {
    render: solarRoiPage,
    firstInput: '#roi-cost',
    example: runRoiCalculator(ROI_DEFAULTS).view.roiText,
    async interact(page) {
      await page.fill('#roi-maintenance', '100');
      assert.equal(await until(page, '87.5%'), '87.5%');
      await page.fill('#roi-incentives', '20000');
      assert.equal(await until(page, 'Not defined: incentives cover the whole cost'), 'Not defined: incentives cover the whole cost');
    },
    invalid: { input: '#roi-years', value: '25.5', message: /whole number/, recover: '25' }
  },
  {
    render: solarSavingsPage,
    firstInput: '#solsav-production',
    example: runSolarSavingsCalculator(SOLAR_SAVINGS_EXAMPLE).view.savingsText,
    async interact(page) {
      // The share used at home and the export credit have no default: the user enters them.
      await page.fill('#solsav-self-use', '100');
      await page.fill('#solsav-export', '0.05');
      assert.equal(await until(page, '$1,600.00'), '$1,600.00');
      await page.fill('#solsav-production', '1000');
      await page.fill('#solsav-self-use', '50');
      await page.fill('#solsav-fees', '200');
      assert.equal(await until(page, '-$95.00'), '-$95.00');
      assert.ok((await page.locator('#calc-results-body').textContent()).includes('solar fees are more than the bill savings'));
    },
    invalid: { input: '#solsav-retail', value: '16', message: /dollars per kWh, for example 0\.16/, recover: '0.16' }
  },
  {
    render: solarPanelSizePage,
    firstInput: '#panelsize-annual',
    example: runSizeCalculator(SIZE_EXAMPLE).view.sizeText,
    async interact(page) {
      await page.fill('#panelsize-annual', '7300');
      await page.fill('#panelsize-sun', '4');
      await page.fill('#panelsize-losses', '0');
      await page.fill('#panelsize-panel', '500');
      assert.equal(await until(page, '5.00 kW'), '5.00 kW');
      assert.ok((await page.locator('#calc-results-body').textContent()).includes('10'), 'exactly 10 panels');
    },
    invalid: { input: '#panelsize-sun', value: '24.01', message: /24 or less/, recover: '4.5' }
  },
  {
    render: solarPanelOutputPage,
    firstInput: '#paneloutput-size',
    example: runOutputCalculator(OUTPUT_EXAMPLE).view.dailyText,
    async interact(page) {
      await page.fill('#paneloutput-sun', '4.5');
      await page.fill('#paneloutput-losses', '14');
      await page.fill('#paneloutput-size', '5');
      const expected = runOutputCalculator({ sizeKw: '5', sunHours: '4.5', losses: '14' }).view.dailyText;
      assert.equal(await until(page, expected), expected);
      assert.ok((await page.locator('#calc-results-body').textContent()).includes(runOutputCalculator({ sizeKw: '5', sunHours: '4.5', losses: '14' }).view.monthlyText));
    },
    invalid: { input: '#paneloutput-losses', value: '99.01', message: /99 or less/, recover: '14' }
  }
];
