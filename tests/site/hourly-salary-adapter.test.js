import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHourlySalaryForm, runHourlySalaryCalculator, HOURLY_SALARY_DEFAULTS } from '../../src/adapters/hourly-salary.js';
import { hourlySalaryResults, hourlySalaryQuickResult, hourlySalaryAnnouncement } from '../../src/components/hourly-salary-results.js';
import { hourlySalaryForm, HOURLY_SALARY_FIELD_IDS } from '../../src/components/hourly-salary-form.js';

function view(values) {
  const result = runHourlySalaryCalculator({ ...HOURLY_SALARY_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: $25 an hour is $52,000 a year', () => {
  const result = view({});
  assert.equal(result.pay.year, 52_000);
  const markup = String(hourlySalaryResults(result));
  assert.match(markup, /Annual salary/);
  assert.match(markup, /\$52,000/);
  assert.match(markup, /\$4,333\.33/);
  assert.match(markup, /class="is-selected" aria-current="true">\s*<th scope="row">Hourly/);
  assert.doesNotMatch(markup, /Per hour actually worked/);
  assert.match(String(hourlySalaryQuickResult(result)), /\$25\.00 an hour is <strong>\$52,000 a year<\/strong>/);
  assert.equal(hourlySalaryAnnouncement(result), '$25.00 an hour is $52,000 a year, $4,333.33 a month and $25.00 an hour.');
});

test('a salary leads with the hourly rate; paid days off add the per-hour-worked figure', () => {
  const result = view({ amount: '$60,000', period: 'year', paidDaysOff: '25' });
  const markup = String(hourlySalaryResults(result));
  assert.match(markup, /Hourly rate/);
  assert.match(markup, /\$28\.85/);
  assert.match(markup, /Per hour actually worked/);
  assert.match(markup, /\$31\.91/);
  assert.match(String(hourlySalaryQuickResult(result)), /\$60,000\.00 a year is <strong>\$28\.85 an hour<\/strong>/);
});

test('blank optional fields fall back to a full-time schedule; unknown periods fall back to hourly', () => {
  const parsed = parseHourlySalaryForm({ amount: '20', period: 'fortnight', hoursPerWeek: '', daysPerWeek: '', weeksPerYear: '', overtimeHours: '', overtimeMultiplier: '', paidDaysOff: '' });
  assert.deepEqual(parsed, { ok: true, input: { amount: 20, period: 'hour', hoursPerWeek: 40, daysPerWeek: 5, weeksPerYear: 52, overtimeHours: 0, overtimeMultiplier: 1.5, paidDaysOff: 0 } });
});

test('overtime and averaging notes', () => {
  const markup = String(hourlySalaryResults(view({ amount: '20', overtimeHours: '5', weeksPerYear: '50' })));
  assert.match(markup, /including 250 overtime hours worth \$7,500/);
  assert.match(markup, /average your annual pay across the year/);
});

test('validation messages', () => {
  const bad = parseHourlySalaryForm({ ...HOURLY_SALARY_DEFAULTS, amount: '', hoursPerWeek: '0', weeksPerYear: '53', overtimeMultiplier: '0.5' });
  assert.equal(bad.ok, false);
  assert.equal(bad.errors.amount, 'Pay is required.');
  assert.equal(bad.errors.hoursPerWeek, 'Hours a week must be greater than 0.');
  assert.equal(bad.errors.weeksPerYear, 'Paid weeks a year must be 52 or less.');
  assert.equal(bad.errors.overtimeMultiplier, 'Overtime pay rate must be at least 1.');
  assert.equal(parseHourlySalaryForm({ ...HOURLY_SALARY_DEFAULTS, hoursPerWeek: '100', overtimeHours: '80' }).errors.overtimeHours,
    'Regular and overtime hours together cannot be more than 168 a week.');
  assert.equal(parseHourlySalaryForm({ ...HOURLY_SALARY_DEFAULTS, paidDaysOff: '260' }).errors.paidDaysOff,
    'Paid days off must be fewer than the days you work in a year.');
  assert.equal(parseHourlySalaryForm({ ...HOURLY_SALARY_DEFAULTS, amount: '0' }).errors.amount, 'Pay must be greater than 0.');
});

test('form renders every field id, labelled, with the selected period', () => {
  const markup = String(hourlySalaryForm({ ...HOURLY_SALARY_DEFAULTS, period: 'month' }, { amount: 'Pay is required.' }));
  for (const id of Object.values(HOURLY_SALARY_FIELD_IDS)) {
    assert.match(markup, new RegExp(`id="${id}"`));
    assert.match(markup, new RegExp(`for="${id}"`));
  }
  assert.match(markup, /<option value="month" selected>a month<\/option>/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /<p class="field__error" id="hs-amount-error">Pay is required\.<\/p>/);
});
