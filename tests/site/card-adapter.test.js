import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCardForm, runCardCalculator, CARD_DEFAULTS } from '../../src/adapters/credit-card-payoff.js';
import { creditCardResults } from '../../src/components/credit-card-results.js';
import { creditCardForm } from '../../src/components/credit-card-form.js';
import { formatCurrency } from '../../src/lib/format.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent month-by-month reference, written without the engines.
function simulate(balance, apr, payment) {
  const i = apr / 1200;
  let remaining = balance;
  let interest = 0;
  let months = 0;
  while (remaining > 1e-8) {
    const charge = remaining * i;
    remaining = remaining + charge - Math.min(payment, remaining + charge);
    interest += charge;
    months += 1;
  }
  return { months, interest };
}

function view(values) {
  const result = runCardCalculator({ ...CARD_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('fixed payment matches an independent simulation', () => {
  const result = view({});
  const ref = simulate(6000, 24, 250);
  assert.equal(result.payments, ref.months);
  close(result.totalInterest, ref.interest);
  close(result.card.firstMonthInterest, 120);
  close(result.totalRepayment, 6000 + ref.interest);
});

test('target mode solves a payment that clears the card on time', () => {
  const result = view({ mode: 'target', targetMonths: '18' });
  assert.equal(result.payments, 18);
  const ref = simulate(6000, 24, result.monthlyPayment);
  assert.equal(ref.months, 18);
  close(result.totalInterest, ref.interest);
  assert.equal(result.extra, null);
  assert.doesNotMatch(String(creditCardResults(result)), /id="extra-heading"/);
});

test('extra payment compares plans and saves interest', () => {
  const result = view({ extraMonthly: '100' });
  const ref = simulate(6000, 24, 350);
  assert.equal(result.extra.payments, ref.months);
  close(result.extra.totalInterest, ref.interest);
  close(result.extra.interestSaved, result.totalInterest - ref.interest);
  assert.equal(result.schedule.basis, 'with-extra');
});

test('comparison lists debt-free dates plus your own plan', () => {
  const rows = view({}).termComparison;
  assert.deepEqual(rows.map((row) => row.termMonths), [12, 24, view({}).payments, 36, 48, 60]);
  assert.equal(rows.filter((row) => row.selected).length, 1);
  const target = view({ mode: 'target', targetMonths: '24' }).termComparison;
  assert.deepEqual(target.map((row) => row.termMonths), [12, 24, 36, 48, 60]);
  assert.equal(target.find((row) => row.selected).termMonths, 24);
});

test('zero APR pays off with no interest', () => {
  const result = view({ apr: '0', monthlyPayment: '500' });
  assert.equal(result.payments, 12);
  assert.equal(result.totalInterest, 0);
});

test('a payment that does not cover interest is a field error, not a crash', () => {
  const noProgress = runCardCalculator({ ...CARD_DEFAULTS, monthlyPayment: '120' });
  assert.equal(noProgress.ok, false);
  assert.match(noProgress.errors.monthlyPayment, /does not cover the monthly interest/);
  const tooSlow = runCardCalculator({ ...CARD_DEFAULTS, balance: '10000', apr: '3', monthlyPayment: '26' });
  assert.match(tooSlow.errors.monthlyPayment, /more than 100 years/);
});

test('only the selected mode is validated', () => {
  const paymentMode = parseCardForm({ ...CARD_DEFAULTS, targetMonths: 'nonsense' });
  assert.equal(paymentMode.ok, true);
  const targetMode = parseCardForm({ ...CARD_DEFAULTS, mode: 'target', monthlyPayment: '', targetMonths: '24' });
  assert.equal(targetMode.ok, true);
  const bad = parseCardForm({ ...CARD_DEFAULTS, mode: 'target', targetMonths: '12.5' });
  assert.deepEqual(bad.errors, { targetMonths: 'Months to pay off must be a whole number.' });
});

test('invalid card inputs produce field messages', () => {
  const parsed = parseCardForm({ ...CARD_DEFAULTS, balance: '', apr: '-3', monthlyPayment: '0', extraMonthly: 'abc' });
  assert.deepEqual(parsed.errors, {
    balance: 'Card balance is required.',
    apr: 'APR cannot be negative.',
    monthlyPayment: 'Monthly payment must be greater than 0.',
    extraMonthly: 'Extra monthly payment must be a number.'
  });
});

test('largest allowed balance and rate stay finite', () => {
  const result = view({ balance: '1000000', apr: '99', mode: 'target', targetMonths: '360' });
  assert.ok(Number.isFinite(result.monthlyPayment));
  assert.equal(result.payments, 360);
});

test('results and form markup', () => {
  const result = view({ extraMonthly: '50' });
  const markup = String(creditCardResults(result));
  for (const value of [result.monthlyPayment, result.totalInterest, result.card.firstMonthInterest, result.extra.interestSaved]) {
    assert.ok(markup.includes(formatCurrency(value)), `missing ${formatCurrency(value)}`);
  }
  assert.match(markup, /payments at 24% APR/);
  assert.doesNotMatch(markup, /&quot;|NaN|Infinity/);
  const form = String(creditCardForm());
  assert.match(form, /<input id="mode-payment" name="mode" type="radio" value="payment" checked>/);
  assert.match(form, /<legend>How do you want to plan\?<\/legend>/);
  for (const id of ['card-balance', 'card-apr', 'monthly-payment', 'extra-monthly', 'target-months', 'start-month']) {
    assert.match(form, new RegExp(`<label for="${id}">`));
  }
});
