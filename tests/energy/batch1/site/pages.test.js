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

/** slug → { page, form, fieldIds } for every draft page built so far. */
export const PAGES = {
  'utility-cost-calculator': { page: utilityCostPage, form: utilityForm, fieldIds: UTILITY_FIELD_IDS },
  'solar-price-per-watt-calculator': { page: solarPricePerWattPage, form: ppwForm, fieldIds: PPW_FIELD_IDS },
  'electric-bill-calculator': { page: electricBillPage, form: billForm, fieldIds: BILL_FIELD_IDS },
  'solar-payback-calculator': { page: solarPaybackPage, form: paybackForm, fieldIds: PAYBACK_FIELD_IDS }
};

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
