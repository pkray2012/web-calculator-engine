import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCompoundForm, runCompoundCalculator, COMPOUND_DEFAULTS } from '../../src/adapters/compound-interest.js';
import { compoundResults, compoundQuickResult, compoundAnnouncement } from '../../src/components/compound-results.js';
import { compoundForm, COMPOUND_FIELD_IDS } from '../../src/components/compound-form.js';

function view(values) {
  const result = runCompoundCalculator({ ...COMPOUND_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches the engine reference (tests/compound-interest.test.js)', () => {
  const result = view({});
  assert.ok(Math.abs(result.futureValue - 144572.720454924) < 1e-6);
  assert.match(String(compoundQuickResult(result)), /\$144,572\.72/);
  assert.equal(compoundAnnouncement(result), 'Your balance grows to $144,572.72 after 20 years, with $86,572.72 of interest.');
  const markup = String(compoundResults(result));
  assert.match(markup, /id="ci-schedule"/);
  assert.match(markup, /rule of 72/);
  assert.match(markup, /Simple interest would give \$105,460/);
});

test('inflation shows today’s dollars; a blank contribution counts as zero', () => {
  assert.match(String(compoundResults(view({ inflationPercent: '3' }))), /\$80,046 in today&#39;s dollars at 3% inflation/);
  assert.equal(view({ monthlyContribution: '' }).totalContributed, 10000);
});

test('errors: nothing deposited, fractional years, rate out of range', () => {
  assert.match(parseCompoundForm({ ...COMPOUND_DEFAULTS, initialDeposit: '', monthlyContribution: '' }).errors.initialDeposit, /Enter an initial deposit/);
  assert.deepEqual(Object.keys(parseCompoundForm({ ...COMPOUND_DEFAULTS, years: '2.5' }).errors), ['years']);
  assert.deepEqual(Object.keys(parseCompoundForm({ ...COMPOUND_DEFAULTS, ratePercent: '80' }).errors), ['ratePercent']);
});

test('unknown compounding and timing fall back to monthly and end of month', () => {
  const parsed = parseCompoundForm({ ...COMPOUND_DEFAULTS, compounding: 'x', contributionTiming: 'y' });
  assert.equal(parsed.input.compounding, 'monthly');
  assert.equal(parsed.input.contributionTiming, 'end');
});

test('form renders every field id and the radios', () => {
  const markup = String(compoundForm());
  for (const id of Object.values(COMPOUND_FIELD_IDS).filter((id) => id !== COMPOUND_FIELD_IDS.compounding && id !== COMPOUND_FIELD_IDS.contributionTiming)) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(markup, /id="ci-comp-monthly" name="compounding" type="radio" value="monthly" checked/);
  assert.match(markup, /id="ci-timing-end" name="contributionTiming" type="radio" value="end" checked/);
});
