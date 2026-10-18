import test from 'node:test';
import assert from 'node:assert/strict';

import { parseStairForm, runStairCalculator, STAIR_DEFAULTS } from '../../src/adapters/stair.js';
import { stairPage, STAIR_SOURCES } from '../../src/pages/stair-calculator.js';
import { stairForm, STAIR_FIELD_IDS } from '../../src/components/stair-form.js';
import { formatInches } from '../../src/components/stair-results.js';
import { findCalculator, liveCalculators, relatedCalculators, CALCULATORS } from '../../src/content/site.js';

test('defaults calculate the 9 ft example', () => {
  const run = runStairCalculator(STAIR_DEFAULTS);
  assert.equal(run.ok, true);
  assert.equal(run.view.result.risers, 14);
  assert.equal(run.input.risers, null);
});

test('a chosen riser count is passed through', () => {
  const run = runStairCalculator({ ...STAIR_DEFAULTS, risers: '15' });
  assert.equal(run.ok, true);
  assert.equal(run.view.result.risers, 15);
});

test('invalid values give field errors', () => {
  const parsed = parseStairForm({ ...STAIR_DEFAULTS, totalRise: '', treadDepth: 'x', risers: '1', maxRiser: '0' });
  assert.equal(parsed.ok, false);
  for (const field of ['totalRise', 'treadDepth', 'risers', 'maxRiser']) assert.ok(parsed.errors[field], field);
  assert.ok(parseStairForm({ ...STAIR_DEFAULTS, risers: '12.5' }).errors.risers);
});

test('tread stock as thick as the riser is rejected as a field error, not an exception', () => {
  const parsed = parseStairForm({ ...STAIR_DEFAULTS, treadThickness: '6', totalRise: '24' }); // 4 risers of 6 in
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.treadThickness);
});

test('inches are shown to the nearest 1/16, reduced', () => {
  assert.equal(formatInches(108 / 14), '7 11/16 in');
  assert.equal(formatInches(10.5), '10 1/2 in');
  assert.equal(formatInches(12), '12 in');
  assert.equal(formatInches(169.38, { feet: true }), '14 ft 1 3/8 in');
  assert.equal(formatInches(144, { feet: true }), '12 ft 0 in');
  assert.equal(formatInches(7.99), '8 in');
});

test('the form labels every field', () => {
  const markup = String(stairForm());
  for (const id of Object.values(STAIR_FIELD_IDS)) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`), id);
});

test('draft page renders with computed figures and no broken values', () => {
  const page = stairPage();
  const body = String(page.body);
  assert.equal(page.path, '/calculators/stair-calculator/');
  assert.equal((body.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.ok(body.includes('7 11/16 in'));
  assert.ok(body.includes('14 ft 1 3/8 in'));
  assert.ok(!/NaN|undefined|Infinity|∞/.test(body));
  for (const source of Object.values(STAIR_SOURCES)) assert.ok(body.includes(source.url));
  const escapedTitle = page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  assert.ok(escapedTitle.length <= 70, `title ${escapedTitle.length}`);
  assert.ok(page.description.length >= 70 && page.description.length <= 170, `description ${page.description.length}`);
});

test('the calculator stays a draft: not live and never linked from live pages', () => {
  const entry = findCalculator('stair-calculator');
  assert.equal(entry.status, 'planned');
  assert.ok(!liveCalculators().some((calc) => calc.slug === entry.slug));
  for (const calc of liveCalculators(CALCULATORS)) {
    assert.ok(!relatedCalculators(calc.slug).some((related) => related.slug === entry.slug));
  }
});
