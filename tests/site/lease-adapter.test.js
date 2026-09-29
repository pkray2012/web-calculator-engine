import test from 'node:test';
import assert from 'node:assert/strict';

import { parseLeaseForm, runLeaseCalculator, LEASE_DEFAULTS } from '../../src/adapters/car-lease.js';
import { carLeaseResults, carLeaseQuickResult, carLeaseAnnouncement } from '../../src/components/car-lease-results.js';
import { carLeaseForm, LEASE_FIELD_IDS } from '../../src/components/car-lease-form.js';

function view(values) {
  const result = runLeaseCalculator({ ...LEASE_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches the independent reference (tests/car-lease.test.js)', () => {
  const result = view({});
  assert.ok(Math.abs(result.lease.payment - 538.6424583333334) < 1e-9);
  assert.ok(Math.abs(result.lease.dueAtSigning - (3000 + 538.6424583333334)) < 1e-9);
  assert.equal(result.leaseCheaper, true);
  assert.match(String(carLeaseResults(result)), /leasing costs about <strong>\$1,615 less<\/strong>/);
  assert.match(String(carLeaseQuickResult(result)), /\$538\.64/);
});

test('a higher lease rate can make buying cheaper', () => {
  const result = view({ leaseApr: '9' });
  assert.equal(result.leaseCheaper, false);
  assert.match(carLeaseAnnouncement(result), /buying costs about \$1,235 less/);
});

test('results show the payment build-up and the comparison', () => {
  const markup = String(carLeaseResults(view({})));
  for (const id of ['lease-payment', 'lease-vs-buy']) assert.match(markup, new RegExp(`id="${id}"`));
  assert.match(markup, /Money factor 0\.00250/);
});

test('validation: loan shorter than the lease, residual bounds, and an over-large down payment', () => {
  assert.match(parseLeaseForm({ ...LEASE_DEFAULTS, loanMonths: '24' }).errors.loanMonths, /at least as long as the lease/);
  assert.ok(parseLeaseForm({ ...LEASE_DEFAULTS, residualPercent: '99' }).errors.residualPercent);
  const tooMuch = runLeaseCalculator({ ...LEASE_DEFAULTS, downPayment: '20000' });
  assert.equal(tooMuch.ok, false);
  assert.match(tooMuch.errors.downPayment, /below the residual value/);
});

test('form labels every field and marks errors', () => {
  const markup = String(carLeaseForm(LEASE_DEFAULTS, { msrp: 'Enter the MSRP.' }));
  for (const id of Object.values(LEASE_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /Enter the MSRP\./);
});
