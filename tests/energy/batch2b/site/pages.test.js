/**
 * Home Energy Batch 2b draft pages: each renders with computed figures, meets
 * the site audit's title and description limits, labels every field, and
 * stays out of the live site (planned status, not in the main registry).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../../../../src/lib/html.js';
import { ENERGY_BATCH2B, findEnergyBatch2bCalculator } from '../../../../src/content/energy-batch2b.js';
import { ENERGY_BATCH1 } from '../../../../src/content/energy-batch1.js';
import { ENERGY_BATCH2 } from '../../../../src/content/energy-batch2.js';
import { CALCULATORS } from '../../../../src/content/site.js';
import { solarRoiPage } from '../../../../src/pages/energy/solar-roi-calculator.js';
import { roiForm, ROI_FIELD_IDS } from '../../../../src/components/energy/solar-roi-form.js';
import { solarSavingsPage } from '../../../../src/pages/energy/solar-savings-calculator.js';
import { solarSavingsForm, SOLAR_SAVINGS_FIELD_IDS } from '../../../../src/components/energy/solar-savings-form.js';
import { solarPanelSizePage } from '../../../../src/pages/energy/solar-panel-size-calculator.js';
import { sizeForm, SIZE_FIELD_IDS } from '../../../../src/components/energy/solar-panel-size-form.js';
import { solarPanelOutputPage } from '../../../../src/pages/energy/solar-panel-output-calculator.js';
import { outputForm, OUTPUT_FIELD_IDS } from '../../../../src/components/energy/solar-panel-output-form.js';

/** slug → { page, form, fieldIds } for every Batch 2b draft page. */
export const PAGES = {
  'solar-roi-calculator': { page: solarRoiPage, form: roiForm, fieldIds: ROI_FIELD_IDS },
  'solar-savings-calculator': { page: solarSavingsPage, form: solarSavingsForm, fieldIds: SOLAR_SAVINGS_FIELD_IDS },
  'solar-panel-size-calculator': { page: solarPanelSizePage, form: sizeForm, fieldIds: SIZE_FIELD_IDS },
  'solar-panel-output-calculator': { page: solarPanelOutputPage, form: outputForm, fieldIds: OUTPUT_FIELD_IDS }
};

test('all four approved Batch 2b pages are built, and the parked B2-18 is not', () => {
  assert.deepEqual(Object.keys(PAGES).sort(), ENERGY_BATCH2B.map((entry) => entry.slug).sort());
  assert.ok(!ENERGY_BATCH2B.some((entry) => /water/.test(entry.slug)), 'B2-18 is parked');
});

test('every Batch 2b entry is a draft with a new, unique /energy/solar/ route outside the main registry', () => {
  assert.equal(ENERGY_BATCH2B.length, 4);
  const otherPaths = new Set([...ENERGY_BATCH1, ...ENERGY_BATCH2].map((entry) => entry.path));
  for (const entry of ENERGY_BATCH2B) {
    assert.equal(entry.status, 'planned', entry.slug);
    assert.equal(entry.batch, '2b', entry.slug);
    assert.match(entry.path, /^\/energy\/solar\/[a-z-]+-calculator\/$/);
    assert.ok(!CALCULATORS.some((calc) => calc.slug === entry.slug || calc.path === entry.path), `${entry.slug} is not in site.js`);
    assert.ok(!otherPaths.has(entry.path), `${entry.slug} does not reuse a Batch 1 or Batch 2 route`);
    for (const related of entry.related) assert.ok(findEnergyBatch2bCalculator(related), `${entry.slug} → ${related}`);
  }
  assert.equal(new Set(ENERGY_BATCH2B.map((entry) => entry.path)).size, 4);
});

test('engineering values have no default: sun hours, losses, share used at home and export credit start blank', () => {
  for (const [form, names] of [[sizeForm, ['sunHours', 'losses']], [outputForm, ['sunHours', 'losses']], [solarSavingsForm, ['selfUse', 'exportRate']]]) {
    for (const name of names) assert.match(String(form()), new RegExp(`name="${name}"[^>]*value=""`), name);
  }
});

for (const [slug, { page: render, form, fieldIds }] of Object.entries(PAGES)) {
  test(`${slug}: page renders with computed figures and valid metadata`, () => {
    const page = render();
    const entry = findEnergyBatch2bCalculator(slug);
    const body = String(page.body);
    assert.equal(page.path, entry.path);
    assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
    assert.ok(!/NaN|undefined|Infinity|∞|\[object|null/.test(body), 'no broken values');
    assert.ok(!/tax credit|25D/i.test(body), 'no tax-credit wording');
    assert.ok(escapeHtml(page.title).length <= 70, `title ${escapeHtml(page.title).length}`);
    const description = escapeHtml(page.description).length;
    assert.ok(description >= 70 && description <= 170, `description ${description}`);
    assert.ok(page.scripts.every((script) => script.startsWith('client/energy/')));
    assert.match(body, /Your inputs stay in your browser\./);
    assert.match(body, /href="\/about\/"/);
    assert.match(body, /example values|example inputs|illustrative values/, 'example figures are labelled');
    const faq = page.structuredData.find((data) => data['@type'] === 'FAQPage');
    assert.ok(faq && faq.mainEntity.length >= 3, 'FAQ structured data');
    assert.ok(!/null|NaN|Infinity/.test(JSON.stringify(page.structuredData)), 'structured data has no null, NaN or Infinity');
  });

  test(`${slug}: the form labels every field`, () => {
    const markup = String(form());
    for (const id of Object.values(fieldIds)) assert.ok(new RegExp(`<label[^>]+for="${id}"`).test(markup), id);
  });
}

test('required disclosures are on the pages (specs r8.1)', () => {
  const roi = String(solarRoiPage().body);
  assert.ok(!/never/i.test(roi), 'no ROI output or copy says "never" (spec B1-11)');
  assert.match(roi, /calculator's own definition/);
  assert.match(roi, /not an internal rate of return \(IRR\)/);
  const savings = String(solarSavingsPage().body);
  assert.match(savings, /Billing rules for solar differ by utility and plan\. Enter the credit your plan gives for each kWh sent to the grid; this calculator does not know your plan\./);
  assert.match(savings, /eia\.gov\/energyexplained\/electricity\/prices-and-factors-affecting-prices/, 'the EIA note is sourced');
  for (const body of [String(solarPanelSizePage().body), String(solarPanelOutputPage().body)]) {
    assert.match(body, /Neither has a default/);
    assert.match(body, /not a system design/);
    assert.match(body, /atb\.nlr\.gov/, 'the DC convention is sourced (E5)');
  }
  assert.match(String(solarPanelSizePage().body), /area is not calculated/);
  assert.match(String(solarPanelOutputPage().body), /not a forecast/);
});
