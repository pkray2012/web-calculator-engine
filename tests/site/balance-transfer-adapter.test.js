import test from 'node:test';
import assert from 'node:assert/strict';

import { parseTransferForm, runTransferCalculator, TRANSFER_DEFAULTS } from '../../src/adapters/balance-transfer.js';
import { balanceTransferResults, balanceTransferQuickResult, balanceTransferAnnouncement } from '../../src/components/balance-transfer-results.js';
import { balanceTransferForm, TRANSFER_FIELD_IDS } from '../../src/components/balance-transfer-form.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function view(values) {
  const result = runTransferCalculator({ ...TRANSFER_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches the hand-checked figures', () => {
  const result = view({});
  close(result.transferFee, 180);
  close(result.transfer.balanceAtPromoEnd, 780);
  close(result.transfer.interest, 27.08);
  assert.equal(result.transfer.payoffMonths, 21);
  assert.equal(result.keep.payoffMonths, 27);
  close(result.netSavings, 1634.36);
  close(result.paymentToClearDuringPromo, 343.33);
});

test('results render the verdict, comparison and schedule', () => {
  const markup = String(balanceTransferResults(view({})));
  assert.match(markup, /Saves \$1,634\.36/);
  assert.match(markup, /\$780\.00 is still owed when the intro period ends/);
  assert.match(markup, /id="transfer-compare"/);
  assert.match(markup, /id="transfer-schedule"/);
  assert.match(markup, /Show all 21 monthly payments/);
  assert.match(String(balanceTransferQuickResult(view({}))), /Saves \$1,634\.36/);
  assert.match(balanceTransferAnnouncement(view({})), /Fee \$180\.00/);
});

test('a payment that clears the balance in the intro period gets the plain savings note', () => {
  const markup = String(balanceTransferResults(view({ monthlyPayment: '400' })));
  assert.doesNotMatch(markup, /still owed/);
  assert.match(markup, /The transfer saves/);
});

test('a fee larger than the interest avoided is reported as a cost', () => {
  const result = view({ balance: '1000', currentApr: '18', monthlyPayment: '500', transferFee: '5', introMonths: '6' });
  assert.ok(result.netSavings < 0);
  assert.match(String(balanceTransferResults(result)), /Costs \$\d+\.\d\d more/);
  assert.match(String(balanceTransferResults(result)), /does not save money/);
});

test('invalid inputs return field errors keyed by form field', () => {
  const parsed = parseTransferForm({ ...TRANSFER_DEFAULTS, balance: '0', transferFee: '11', introMonths: '6.5' });
  assert.equal(parsed.ok, false);
  assert.deepEqual(Object.keys(parsed.errors).sort(), ['balance', 'introMonths', 'transferFee']);
});

test('payments that never pay off become monthly payment errors', () => {
  const keep = runTransferCalculator({ ...TRANSFER_DEFAULTS, monthlyPayment: '100' });
  assert.equal(keep.ok, false);
  assert.match(keep.errors.monthlyPayment, /higher monthly payment/);
  const after = runTransferCalculator({ ...TRANSFER_DEFAULTS, currentApr: '5', monthlyPayment: '50', postIntroApr: '29.99', introMonths: '12' });
  assert.equal(after.ok, false);
  assert.match(after.errors.monthlyPayment, /once the intro period ends|monthly interest/);
});

test('form labels every field and shows errors inline', () => {
  const markup = String(balanceTransferForm(TRANSFER_DEFAULTS, { monthlyPayment: 'Too low.' }));
  for (const id of Object.values(TRANSFER_FIELD_IDS)) assert.match(markup, new RegExp(`<label[^>]+for="${id}"`));
  assert.match(markup, /Too low\./);
  assert.match(markup, /aria-invalid="true"/);
});
