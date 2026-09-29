import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSlrForm, runSlrCalculator, SLR_DEFAULTS } from '../../src/adapters/student-loan-refinance.js';
import { studentLoanRefinanceResults, studentLoanRefinanceQuickResult, studentLoanRefinanceAnnouncement, RESULT_LINKS } from '../../src/components/student-loan-refinance-results.js';
import { studentLoanRefinanceForm, SLR_FIELD_IDS } from '../../src/components/student-loan-refinance-form.js';
import { SOURCES } from '../../src/content/sources.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runSlrCalculator({ ...SLR_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches the hand-checked figures', () => {
  const result = view({});
  assert.equal(result.input.federal, true);
  close(result.current.payment, 402.78);
  close(result.refinance.payment, 379.84);
  close(result.lifetimeSavings, 2752.70);
});

test('federal loans always show the warning with official links; private loans do not', () => {
  const federal = String(studentLoanRefinanceResults(view({})));
  assert.match(federal, /cannot be undone/);
  assert.match(federal, new RegExp(RESULT_LINKS.loanSimulator));
  assert.doesNotMatch(String(studentLoanRefinanceResults(view({ loanType: 'private' }))), /cannot be undone/);
  assert.match(studentLoanRefinanceAnnouncement(view({})), /gives up federal benefits/);
  assert.doesNotMatch(studentLoanRefinanceAnnouncement(view({ loanType: 'private' })), /federal/);
});

test('result links are the registered official sources', () => {
  assert.equal(RESULT_LINKS.studentLoanRefinance, SOURCES.studentLoanRefinance.url);
  assert.equal(RESULT_LINKS.loanSimulator, SOURCES.loanSimulator.url);
});

test('verdicts cover savings, longer-term cost and a worse offer', () => {
  assert.match(String(studentLoanRefinanceResults(view({}))), /Refinancing saves <strong>\$2,752\.70/);
  assert.match(String(studentLoanRefinanceResults(view({ newTermValue: '20' }))), /Lower payment, higher total cost[\s\S]*would save <strong>\$2,752\.70/);
  assert.match(String(studentLoanRefinanceResults(view({ newRate: '7.5' }))), /This offer costs \$1,521\.00 more/);
  const markup = String(studentLoanRefinanceResults(view({})));
  assert.match(markup, /id="slr-compare"/);
  assert.match(markup, /id="slr-terms"/);
  assert.match(markup, /10 years \(your offer\)/);
  assert.match(String(studentLoanRefinanceQuickResult(view({}))), /\$379\.84/);
});

test('invalid inputs return field errors keyed by form field', () => {
  const parsed = parseSlrForm({ ...SLR_DEFAULTS, balance: '', currentRate: '31', newTermValue: '0', fees: '-1' });
  assert.equal(parsed.ok, false);
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['balance', 'currentRate', 'fees', 'newTermValue']);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(studentLoanRefinanceForm(SLR_DEFAULTS, { balance: 'Enter a balance.' }));
  for (const id of Object.values(SLR_FIELD_IDS).filter((id) => id !== SLR_FIELD_IDS.loanType)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /for="slr-type-federal"/);
  assert.match(markup, /Enter a balance\./);
  assert.match(markup, /aria-invalid="true"/);
});
