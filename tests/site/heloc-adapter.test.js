import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHelocForm, buildHelocView, runHelocCalculator, HELOC_DEFAULTS } from '../../src/adapters/heloc.js';
import { helocResults, helocQuickResult, helocAnnouncement } from '../../src/components/heloc-results.js';
import { helocForm, HELOC_FIELD_IDS } from '../../src/components/heloc-form.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

/** Independent closed forms, written without the shared engine. */
const annuity = (principal, annualRate, months) => {
  const r = annualRate / 1200;
  return r === 0 ? principal / months : principal * r / (1 - (1 + r) ** -months);
};
const balanceAfter = (principal, annualRate, payment, months) => {
  const r = annualRate / 1200;
  return r === 0 ? principal - payment * months : principal * (1 + r) ** months - payment * (((1 + r) ** months - 1) / r);
};
const view = (overrides) => buildHelocView(parseHelocForm({ ...HELOC_DEFAULTS, ...overrides }).input);

test('interest-only draw: closed-form payments, shock and total interest', () => {
  for (const [balance, rate, drawYears, repayYears] of [[50000, 8.5, 10, 20], [120000, 7.25, 10, 15], [15000, 11.9, 5, 10], [80000, 0, 10, 20]]) {
    const v = view({ balance: String(balance), rate: String(rate), drawValue: String(drawYears), repaymentValue: String(repayYears) });
    const draw = balance * rate / 1200;
    const repay = annuity(balance, rate, repayYears * 12);
    close(v.drawPayment, draw, 1e-9);
    close(v.repaymentPayment, repay, 1e-9);
    close(v.paymentShock, repay - draw, 1e-9);
    close(v.repaymentStartingBalance, balance, 1e-9);
    close(v.totalInterest, draw * drawYears * 12 + (repay * repayYears * 12 - balance), 1e-6);
    close(v.totalPayments, balance + v.totalInterest, 1e-6);
    if (rate === 0) assert.equal(v.paymentShockPercent, null);
  }
});

test('reference case: $50,000 at 8.5%, 10-year interest-only draw, 20-year repayment', () => {
  const v = view({});
  close(v.drawPayment, 354.1666666666667, 1e-9);
  // 50000 × 0.0070833 ÷ (1 − 1.0070833^−240)
  assert.equal(v.repaymentPayment.toFixed(2), '433.91');
  assert.equal(v.paymentShock.toFixed(2), '79.74');
  assert.equal(Math.round(v.paymentShockPercent), 23);
  assert.equal(v.repaymentStartMonth, 121);
});

test('principal-and-interest draw: level payment, no shock, balance matches closed form', () => {
  const v = view({ drawPayment: 'principalAndInterest' });
  const level = annuity(50000, 8.5, 360);
  close(v.drawPayment, level, 1e-9);
  close(v.repaymentPayment, level, 1e-6);
  close(v.paymentShock, 0, 1e-6);
  close(v.repaymentStartingBalance, balanceAfter(50000, 8.5, level, 120), 1e-6);
  close(v.totalPayments, level * 360, 1e-4);
});

test('rate what-ifs are +1/+2/+3 points and match closed forms', () => {
  const v = view({});
  assert.deepEqual(v.scenarios.map((row) => row.points), [0, 1, 2, 3]);
  for (const row of v.scenarios) {
    close(row.annualRate, 8.5 + row.points, 1e-12);
    close(row.drawPayment, 50000 * row.annualRate / 1200, 1e-9);
    close(row.repaymentPayment, annuity(50000, row.annualRate, 240), 1e-9);
  }
});

test('yearly rows cover both phases and add up to the totals', () => {
  const v = view({ drawValue: '18', drawUnit: 'months', repaymentValue: '5' });
  assert.equal(v.yearly.length, Math.ceil((18 + 60) / 12));
  assert.equal(v.yearly[0].phase, 'draw');
  assert.equal(v.yearly[1].phase, 'both');
  assert.equal(v.yearly.at(-1).phase, 'repayment');
  close(v.yearly.reduce((s, r) => s + r.payment, 0), v.totalPayments, 1e-6);
  close(v.yearly.reduce((s, r) => s + r.interest, 0), v.totalInterest, 1e-6);
  close(v.yearly.at(-1).balance, 0, 1e-6);
});

test('form validation reports each field', () => {
  const bad = runHelocCalculator({ ...HELOC_DEFAULTS, balance: '0', rate: '-1', drawValue: '', repaymentValue: '1.05', repaymentUnit: 'years' });
  assert.equal(bad.ok, false);
  assert.match(bad.errors.balance, /greater than 0/);
  assert.match(bad.errors.rate, /cannot be negative/);
  assert.match(bad.errors.drawValue, /required/);
  assert.match(bad.errors.repaymentValue, /whole months/);
  assert.equal(parseHelocForm({ ...HELOC_DEFAULTS, drawPayment: 'nonsense' }).input.drawPaymentType, 'interestOnly');
});

test('results, quick result and announcement state the key figures', () => {
  const v = view({});
  const markup = String(helocResults(v));
  assert.match(markup, /Payment when repayment starts/);
  assert.match(markup, /\$433\.91/);
  assert.match(markup, /rises by \$79\.74 \(23%\) in month 121/);
  assert.match(markup, /id="rate-scenarios"/);
  assert.match(markup, /id="heloc-yearly"/);
  assert.match(String(helocQuickResult(v)), /\$354\.17.*\$433\.91/s);
  assert.equal(helocAnnouncement(v), 'Draw-period payment $354.17. Repayment payment $433.91. Increase $79.74.');
  const noShock = String(helocResults(view({ drawPayment: 'principalAndInterest' })));
  assert.match(noShock, /payment stays the same/);
  const form = String(helocForm());
  for (const id of Object.values(HELOC_FIELD_IDS)) assert.match(form, new RegExp(`id="${id}`));
});
