import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSavingsForm, runSavingsCalculator, SAVINGS_DEFAULTS } from '../../src/adapters/savings-goal.js';
import { savingsGoalResults, savingsQuickResult, savingsAnnouncement } from '../../src/components/savings-goal-results.js';
import { savingsGoalForm, SAVINGS_FIELD_IDS } from '../../src/components/savings-goal-form.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runSavingsCalculator({ ...SAVINGS_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

// References from an independent Python closed form (see tests/savings-goal.test.js).
test('default example: $20,000 goal, $2,000 saved, 4% APY, 3 years', () => {
  const result = view({});
  close(result.monthlyContribution, 465.384511078057);
  assert.equal(result.months, 36);
  close(result.endingBalance, 20000, 1e-6);
  assert.equal(result.yearly.length, 3);
  assert.deepEqual(result.comparison.map((row) => row.months), [12, 24, 36, 60]);
  assert.equal(result.comparison.find((row) => row.selected).months, 36);
});

test('emergency fund goal is expenses times months', () => {
  const result = view({ goalType: 'emergency' });
  assert.equal(result.target, 21000);
  close(result.monthlyContribution, 491.6029550026378);
  assert.match(String(savingsGoalResults(result)), /6 months × \$3,500\.00 of expenses/);
});

test('a set deposit gives the time to reach the goal', () => {
  const result = view({ plan: 'deposit', monthlyDeposit: '400' });
  assert.equal(result.months, 42);
  assert.ok(result.endingBalance >= 20000);
  assert.match(savingsAnnouncement(result), /reaches \$20,000\.00 in 3 years, 6 months/);
});

test('zero APY is straight division; a funded goal says so', () => {
  close(view({ apy: '0' }).monthlyContribution, 500);
  const funded = view({ currentSavings: '25000' });
  assert.equal(funded.alreadyFunded, true);
  assert.match(String(savingsGoalResults(funded)), /already reached this goal/);
  assert.match(String(savingsQuickResult(funded)), /already reached/);
});

test('mode-specific validation and a deposit too small to finish', () => {
  assert.equal(parseSavingsForm({ ...SAVINGS_DEFAULTS, goalType: 'emergency', goalAmount: '' }).ok, true);
  assert.equal(parseSavingsForm({ ...SAVINGS_DEFAULTS, plan: 'deposit', timeValue: '' }).ok, true);
  const parsed = parseSavingsForm({ ...SAVINGS_DEFAULTS, goalAmount: '0', apy: '25', timeValue: '2.55' });
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['apy', 'goalAmount', 'timeValue']);
  assert.match(parseSavingsForm({ ...SAVINGS_DEFAULTS, goalType: 'emergency', coverageMonths: '4.5' }).errors.coverageMonths, /whole number/);
  const tiny = runSavingsCalculator({ ...SAVINGS_DEFAULTS, plan: 'deposit', monthlyDeposit: '1' });
  assert.equal(tiny.ok, false);
  assert.match(tiny.errors.monthlyDeposit, /more than 50 years/);
});

test('form labels every field and marks errors', () => {
  const markup = String(savingsGoalForm(SAVINGS_DEFAULTS, { goalAmount: 'Enter a goal.' }));
  for (const id of ['savings-goal', 'savings-expenses', 'savings-coverage', 'savings-current', 'savings-apy', 'savings-time', 'savings-deposit']) {
    assert.match(markup, new RegExp(`for="${id}"`));
  }
  assert.ok(Object.values(SAVINGS_FIELD_IDS).includes('savings-plan'));
  assert.match(markup, /Enter a goal\./);
  assert.match(markup, /aria-invalid="true"/);
});
