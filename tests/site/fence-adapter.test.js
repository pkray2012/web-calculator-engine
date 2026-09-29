import test from 'node:test';
import assert from 'node:assert/strict';

import { parseFenceForm, runFenceCalculator, FENCE_DEFAULTS } from '../../src/adapters/fence.js';
import { fenceResults, fenceQuickResult, fenceAnnouncement } from '../../src/components/fence-results.js';
import { fenceForm, FENCE_FIELD_IDS } from '../../src/components/fence-form.js';

function view(values) {
  const result = runFenceCalculator({ ...FENCE_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 330 pickets, 20 posts, 57 rails (reference in tests/fence.test.js)', () => {
  const result = view({});
  assert.deepEqual([result.pickets, result.posts, result.rails], [330, 20, 57]);
  assert.match(String(fenceQuickResult(result)), /330 pickets/);
  assert.equal(fenceAnnouncement(result), '330 pickets, 20 posts and 57 rails for 150 feet of fence.');
  const markup = String(fenceResults(result));
  assert.match(markup, /id="fence-materials"/);
  assert.match(markup, /Add prices/);
});

test('prices add a cost column and total', () => {
  const result = view({ pricePerPost: '20', pricePerRail: '9', pricePerPicket: '3' });
  assert.equal(result.totalCost, 1903);
  assert.match(String(fenceResults(result)), /\$1,903\.00/);
});

test('blank gap and waste count as zero', () => {
  const parsed = parseFenceForm({ ...FENCE_DEFAULTS, gapInches: '', wastePercent: '' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.input.gapInches, 0);
  assert.equal(view({ gapInches: '', wastePercent: '' }).pickets, 328);
});

test('errors are keyed by field', () => {
  assert.deepEqual(Object.keys(parseFenceForm({ ...FENCE_DEFAULTS, lengthFeet: '' }).errors), ['lengthFeet']);
  assert.deepEqual(Object.keys(parseFenceForm({ ...FENCE_DEFAULTS, railsPerSection: '1.5' }).errors), ['railsPerSection']);
  assert.deepEqual(Object.keys(parseFenceForm({ ...FENCE_DEFAULTS, postSpacingFeet: '20' }).errors), ['postSpacingFeet']);
});

test('form renders every field id', () => {
  const markup = String(fenceForm());
  for (const id of Object.values(FENCE_FIELD_IDS)) assert.match(markup, new RegExp(`id="${id}"`));
});
