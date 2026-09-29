import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyNeeded, calculateTimeToGoal, savingsSchedule, emergencyFundTarget } from '../src/calculators/savings-goal.js';

test('zero-interest monthly target is simple division', () => {
  const result = calculateMonthlyNeeded({ goalAmount: 12000, currentSavings: 0, annualRate: 0, months: 12 });
  assert.equal(result.monthlyContribution, 1000);
  assert.equal(result.endingBalance, 12000);
  assert.equal(result.interestEarned, 0);
});

test('starting savings reduce the required monthly contribution', () => {
  const result = calculateMonthlyNeeded({ goalAmount: 12000, currentSavings: 6000, annualRate: 0, months: 12 });
  assert.equal(result.monthlyContribution, 500);
});

test('positive APY produces a contribution below straight-line savings', () => {
  const result = calculateMonthlyNeeded({ goalAmount: 50000, currentSavings: 5000, annualRate: 4.5, months: 36 });
  assert.ok(result.monthlyContribution < (50000 - 5000) / 36);
  assert.ok(Math.abs(result.endingBalance - 50000) < 1e-8);
  assert.ok(result.interestEarned > 0);
});

test('time-to-goal reaches the same target from the solved monthly amount', () => {
  const plan = calculateMonthlyNeeded({ goalAmount: 50000, currentSavings: 5000, annualRate: 4.5, months: 36 });
  const result = calculateTimeToGoal({
    goalAmount: 50000,
    currentSavings: 5000,
    monthlyContribution: plan.monthlyContribution,
    annualRate: 4.5,
    maxMonths: 36
  });
  assert.equal(result.months, 36);
  assert.ok(result.endingBalance >= 50000);
});

test('already-funded goal requires zero additional time and contribution', () => {
  const plan = calculateMonthlyNeeded({ goalAmount: 10000, currentSavings: 12000, annualRate: 4, months: 12 });
  assert.equal(plan.monthlyContribution, 0);
  const result = calculateTimeToGoal({ goalAmount: 10000, currentSavings: 12000, monthlyContribution: 1, annualRate: 4 });
  assert.equal(result.months, 0);
  assert.equal(result.endingBalance, 12000);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateMonthlyNeeded({ goalAmount: 0, months: 12 }), /goalAmount/);
  assert.throws(() => calculateMonthlyNeeded({ goalAmount: 1000, months: 0 }), /months/);
  assert.throws(() => calculateTimeToGoal({ goalAmount: 1000, monthlyContribution: 0 }), /monthlyContribution/);
});

// Reference values from an independent Python closed form:
// payment = (goal − start × f) × r ÷ (f − 1), r = (1 + APY)^(1/12) − 1, f = (1 + r)^n.
test('monthly contribution matches independent references', () => {
  const a = calculateMonthlyNeeded({ goalAmount: 50000, currentSavings: 5000, annualRate: 4.5, months: 36 });
  assert.ok(Math.abs(a.monthlyContribution - 1153.0572933399437) < 1e-9);
  const b = calculateMonthlyNeeded({ goalAmount: 24000, currentSavings: 2000, annualRate: 4, months: 24 });
  assert.ok(Math.abs(b.monthlyContribution - 876.0784421068648) < 1e-9);
});

test('an APY compounds to exactly that rate over a year', () => {
  const [row] = savingsSchedule({ currentSavings: 10000, monthlyContribution: 0, annualRate: 5, months: 12 });
  assert.ok(Math.abs(row.balance - 10500) < 1e-9);
  assert.ok(Math.abs(row.interest - 500) < 1e-9);
});

test('solved contributions reach the goal on their deadline, not a month early, for 300 plans', () => {
  for (let i = 0; i < 300; i += 1) {
    const input = {
      goalAmount: 1000 + (i * 7919) % 200000,
      currentSavings: (i * 1231) % 20000,
      annualRate: ((i * 37) % 700) / 100,
      months: 1 + (i * 13) % 120
    };
    const plan = calculateMonthlyNeeded(input);
    if (plan.monthlyContribution === 0) continue;
    const time = calculateTimeToGoal({ ...input, monthlyContribution: plan.monthlyContribution, maxMonths: 1200 });
    assert.equal(time.months, input.months, `case ${i}`);
    const rows = savingsSchedule({ ...input, monthlyContribution: plan.monthlyContribution });
    assert.ok(Math.abs(rows.at(-1).balance - input.goalAmount) < 1e-6 * input.goalAmount, `case ${i} schedule`);
    assert.equal(rows.at(-1).month, input.months);
  }
});

test('schedule rows are yearly with a final partial year', () => {
  const rows = savingsSchedule({ currentSavings: 0, monthlyContribution: 100, annualRate: 0, months: 30 });
  assert.deepEqual(rows.map((row) => [row.year, row.month, row.balance]), [[1, 12, 1200], [2, 24, 2400], [3, 30, 3000]]);
});

test('emergency fund target is expenses times months', () => {
  assert.equal(emergencyFundTarget({ monthlyExpenses: 3500, coverageMonths: 6 }), 21000);
  assert.throws(() => emergencyFundTarget({ monthlyExpenses: 3500, coverageMonths: 2.5 }), RangeError);
});
