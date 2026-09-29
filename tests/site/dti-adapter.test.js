import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDtiForm, runDtiCalculator, DTI_DEFAULTS } from '../../src/adapters/debt-to-income.js';
import { dtiResults, dtiQuickResult, dtiAnnouncement } from '../../src/components/dti-results.js';
import { dtiForm, DTI_FIELD_IDS } from '../../src/components/dti-form.js';

function view(values) {
  const result = runDtiCalculator({ ...DTI_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: $72,000 a year, $1,800 housing, $790 other debts', () => {
  const result = view({});
  assert.equal(result.grossMonthlyIncome, 6000);
  assert.equal(result.totalDebt, 2590);
  assert.ok(Math.abs(result.backEndPercent - 2590 / 6000 * 100) < 1e-12);
  assert.equal(result.frontEndPercent, 30);
  assert.ok(Math.abs(result.reductionNeeded - 430) < 1e-9);
  assert.match(String(dtiResults(result)), /above your 36% target/);
  assert.match(dtiAnnouncement(result), /Debt-to-income ratio 43\.2%, housing ratio 30%\. \$430\.00 a month over/);
});

test('monthly income is used as entered; room under the target is reported', () => {
  const result = view({ incomeValue: '9000', incomeUnit: 'month' });
  assert.equal(result.grossMonthlyIncome, 9000);
  assert.ok(Math.abs(result.roomForNewPayment - (3240 - 2590)) < 1e-9);
  assert.match(String(dtiResults(result)), /within your 36% target/);
  assert.match(String(dtiQuickResult(result)), /28\.8%/);
});

test('the breakdown lists only payments entered, with a total row', () => {
  const markup = String(dtiResults(view({})));
  assert.match(markup, /id="dti-breakdown"/);
  assert.doesNotMatch(markup, /Child support/);
  assert.match(markup, /Student loans/);
});

test('validation: income required and positive, blanks count as zero', () => {
  assert.deepEqual(Object.keys(parseDtiForm({ ...DTI_DEFAULTS, incomeValue: '0', targetPercent: '0' }).errors).sort(), ['incomeValue', 'targetPercent']);
  const blanks = parseDtiForm({ ...DTI_DEFAULTS, housingPayment: '', autoPayment: '' });
  assert.equal(blanks.ok, true);
  assert.equal(blanks.input.housingPayment, 0);
});

test('form labels every field and marks errors', () => {
  const markup = String(dtiForm(DTI_DEFAULTS, { incomeValue: 'Enter income.' }));
  for (const id of Object.values(DTI_FIELD_IDS).filter((id) => id !== 'dti-income-unit')) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Enter income\./);
});
