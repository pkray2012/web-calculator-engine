/**
 * Home Energy Batch 2 draft pages: each renders with computed figures, meets
 * the site audit's title and description limits, labels every field, and
 * stays out of the live site (planned status, not in the main registry).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../../../../src/lib/html.js';
import { ENERGY_BATCH2, findEnergyBatch2Calculator } from '../../../../src/content/energy-batch2.js';
import { ENERGY_BATCH1 } from '../../../../src/content/energy-batch1.js';
import { CALCULATORS } from '../../../../src/content/site.js';
import { electricityCostPage } from '../../../../src/pages/energy/electricity-cost-calculator.js';
import { electricityCostForm, ELECTRICITY_COST_FIELD_IDS } from '../../../../src/components/energy/electricity-cost-form.js';
import { electricityRatePage } from '../../../../src/pages/energy/electricity-rate-calculator.js';
import { rateForm, RATE_FIELD_IDS } from '../../../../src/components/energy/electricity-rate-form.js';
import { evCostPerMilePage } from '../../../../src/pages/energy/ev-cost-per-mile-calculator.js';
import { perMileForm, PER_MILE_FIELD_IDS } from '../../../../src/components/energy/ev-cost-per-mile-form.js';
import { evGasSavingsPage } from '../../../../src/pages/energy/ev-gas-savings-calculator.js';
import { savingsForm, SAVINGS_FIELD_IDS } from '../../../../src/components/energy/ev-gas-savings-form.js';

/** slug → { page, form, fieldIds } for every Batch 2 draft page. */
export const PAGES = {
  'electricity-cost-calculator': { page: electricityCostPage, form: electricityCostForm, fieldIds: ELECTRICITY_COST_FIELD_IDS },
  'electricity-rate-calculator': { page: electricityRatePage, form: rateForm, fieldIds: RATE_FIELD_IDS },
  'ev-cost-per-mile-calculator': { page: evCostPerMilePage, form: perMileForm, fieldIds: PER_MILE_FIELD_IDS },
  'ev-gas-savings-calculator': { page: evGasSavingsPage, form: savingsForm, fieldIds: SAVINGS_FIELD_IDS }
};

test('all four Batch 2 pages are built', () => {
  assert.deepEqual(Object.keys(PAGES).sort(), ENERGY_BATCH2.map((entry) => entry.slug).sort());
});

test('every Batch 2 entry is a draft with a new, unique /energy/ route outside the main registry', () => {
  assert.equal(ENERGY_BATCH2.length, 4);
  const batch1Paths = new Set(ENERGY_BATCH1.map((entry) => entry.path));
  for (const entry of ENERGY_BATCH2) {
    assert.equal(entry.status, 'planned', entry.slug);
    assert.equal(entry.batch, 2, entry.slug);
    assert.match(entry.path, /^\/energy\/(electricity|ev)\/[a-z-]+-calculator\/$/);
    assert.ok(!CALCULATORS.some((calc) => calc.slug === entry.slug || calc.path === entry.path), `${entry.slug} is not in site.js`);
    assert.ok(!batch1Paths.has(entry.path), `${entry.slug} does not reuse a Batch 1 route`);
    for (const related of entry.related) assert.ok(findEnergyBatch2Calculator(related), `${entry.slug} → ${related}`);
  }
  assert.equal(new Set(ENERGY_BATCH2.map((entry) => entry.path)).size, 4);
});

test('the EV cost per mile form has no default charging efficiency', () => {
  assert.match(String(perMileForm()), /name="efficiency"[^>]*value=""/);
});

for (const [slug, { page: render, form, fieldIds }] of Object.entries(PAGES)) {
  test(`${slug}: page renders with computed figures and valid metadata`, () => {
    const page = render();
    const entry = findEnergyBatch2Calculator(slug);
    const body = String(page.body);
    assert.equal(page.path, entry.path);
    assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
    assert.ok(!/NaN|undefined|Infinity|∞|\[object|null/.test(body), 'no broken values');
    assert.ok(!/tax credit|25D/i.test(body), 'no tax-credit wording');
    assert.ok(escapeHtml(page.title).length <= 70, `title ${escapeHtml(page.title).length}`);
    const description = escapeHtml(page.description).length;
    assert.ok(description >= 70 && description <= 170, `description ${description}`);
    assert.ok(page.scripts.every((script) => script.startsWith('client/energy/')));
    const faq = page.structuredData.find((data) => data['@type'] === 'FAQPage');
    assert.ok(faq && faq.mainEntity.length >= 3, 'FAQ structured data');
    assert.ok(!/null|NaN|Infinity/.test(JSON.stringify(page.structuredData)), 'structured data has no null, NaN or Infinity');
  });

  test(`${slug}: the form labels every field`, () => {
    const markup = String(form());
    for (const id of Object.values(fieldIds)) {
      assert.ok(new RegExp(`<label[^>]+for="${id}"`).test(markup) || new RegExp(`data-field="${id}"[^>]*>\\s*<legend>`).test(markup), id);
    }
  });
}

test('required disclosures are on the pages', () => {
  assert.match(String(electricityCostPage().body), /Nameplate watts are a maximum/);
  assert.match(String(evCostPerMilePage().body), /already includes charging losses/);
  assert.match(String(evCostPerMilePage().body), /All-electric miles only/);
  assert.match(String(evGasSavingsPage().body), /All-electric miles only/);
  assert.match(String(evGasSavingsPage().body), /Fuel only/);
  assert.match(String(electricityRatePage().body), /is the price of one more kWh/);
});
