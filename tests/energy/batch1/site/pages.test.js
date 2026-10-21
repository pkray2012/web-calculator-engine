/**
 * Home Energy Batch 1 draft pages: each renders with computed figures, meets
 * the site audit's title and description limits, labels every field, and
 * stays out of the live site (planned status, not in the main registry).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../../../../src/lib/html.js';
import { ENERGY_BATCH1, findEnergyCalculator } from '../../../../src/content/energy-batch1.js';
import { CALCULATORS } from '../../../../src/content/site.js';
import { utilityCostPage } from '../../../../src/pages/energy/utility-cost-calculator.js';
import { utilityForm, UTILITY_FIELD_IDS } from '../../../../src/components/energy/utility-cost-form.js';
import { solarPricePerWattPage } from '../../../../src/pages/energy/solar-price-per-watt-calculator.js';
import { ppwForm, PPW_FIELD_IDS } from '../../../../src/components/energy/solar-price-per-watt-form.js';
import { electricBillPage } from '../../../../src/pages/energy/electric-bill-calculator.js';
import { billForm, BILL_FIELD_IDS } from '../../../../src/components/energy/electric-bill-form.js';
import { solarPaybackPage } from '../../../../src/pages/energy/solar-payback-calculator.js';
import { paybackForm, PAYBACK_FIELD_IDS } from '../../../../src/components/energy/solar-payback-form.js';
import { solarBatteryChargeTimePage } from '../../../../src/pages/energy/solar-battery-charge-time-calculator.js';
import { evChargingTimePage } from '../../../../src/pages/energy/ev-charging-time-calculator.js';
import { batteryForm, evTimeForm, BATTERY_FIELD_IDS, EV_TIME_FIELD_IDS } from '../../../../src/components/energy/charging-time-form.js';
import { evChargingCostPage } from '../../../../src/pages/energy/ev-charging-cost-calculator.js';
import { evCostForm, EV_COST_FIELD_IDS } from '../../../../src/components/energy/ev-charging-cost-form.js';
import { solarFinancingPage } from '../../../../src/pages/energy/solar-financing-calculator.js';
import { financingForm, FINANCING_FIELD_IDS } from '../../../../src/components/energy/solar-financing-form.js';

/** slug → { page, form, fieldIds } for every draft page built so far. */
export const PAGES = {
  'utility-cost-calculator': { page: utilityCostPage, form: utilityForm, fieldIds: UTILITY_FIELD_IDS },
  'solar-price-per-watt-calculator': { page: solarPricePerWattPage, form: ppwForm, fieldIds: PPW_FIELD_IDS },
  'electric-bill-calculator': { page: electricBillPage, form: billForm, fieldIds: BILL_FIELD_IDS },
  'solar-payback-calculator': { page: solarPaybackPage, form: paybackForm, fieldIds: PAYBACK_FIELD_IDS },
  'solar-battery-charge-time-calculator': { page: solarBatteryChargeTimePage, form: batteryForm, fieldIds: BATTERY_FIELD_IDS },
  'ev-charging-time-calculator': { page: evChargingTimePage, form: evTimeForm, fieldIds: EV_TIME_FIELD_IDS },
  'ev-charging-cost-calculator': { page: evChargingCostPage, form: evCostForm, fieldIds: EV_COST_FIELD_IDS },
  'solar-financing-calculator': { page: solarFinancingPage, form: financingForm, fieldIds: FINANCING_FIELD_IDS }
};

test('all eight Batch 1 pages are built', () => {
  assert.deepEqual(Object.keys(PAGES).sort(), ENERGY_BATCH1.map((entry) => entry.slug).sort());
});

test('charging forms have no default measurement point or efficiency (R07)', () => {
  for (const form of [batteryForm, evTimeForm, evCostForm]) {
    const markup = String(form());
    assert.ok(!/name="basis"[^>]*checked/.test(markup), 'no measurement point preselected');
    assert.match(markup, /name="efficiency"[^>]*value=""/);
  }
});

test('every Batch 1 entry is a draft, outside the main registry', () => {
  assert.equal(ENERGY_BATCH1.length, 8);
  for (const entry of ENERGY_BATCH1) {
    assert.equal(entry.status, 'planned', entry.slug);
    assert.ok(!CALCULATORS.some((calc) => calc.slug === entry.slug || calc.path === entry.path), `${entry.slug} is not in site.js`);
    for (const related of entry.related) assert.ok(findEnergyCalculator(related), `${entry.slug} → ${related}`);
  }
});

for (const [slug, { page: render, form, fieldIds }] of Object.entries(PAGES)) {
  test(`${slug}: page renders with computed figures and valid metadata`, () => {
    const page = render();
    const entry = findEnergyCalculator(slug);
    const body = String(page.body);
    assert.equal(page.path, entry.path);
    assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
    assert.ok(!/NaN|undefined|Infinity|∞|\[object/.test(body), 'no broken values');
    assert.ok(escapeHtml(page.title).length <= 70, `title ${escapeHtml(page.title).length}`);
    const description = escapeHtml(page.description).length;
    assert.ok(description >= 70 && description <= 170, `description ${description}`);
    assert.ok(page.scripts.every((script) => script.startsWith('client/energy/')));
    const faq = page.structuredData.find((data) => data['@type'] === 'FAQPage');
    assert.ok(faq && faq.mainEntity.length >= 3, 'FAQ structured data');
  });

  test(`${slug}: the form labels every field`, () => {
    const markup = String(form());
    for (const id of Object.values(fieldIds)) {
      assert.ok(new RegExp(`<label[^>]+for="${id}"`).test(markup) || new RegExp(`<input id="${id}-[a-z-]+"[^>]+type="radio"`).test(markup)
        || new RegExp(`data-field="${id}"[^>]*>\\s*<legend>`).test(markup), id);
    }
  });
}
