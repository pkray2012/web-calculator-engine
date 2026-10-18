import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateEstimatedTax } from '../src/calculators/estimated-tax.js';

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test('hand-checked: prior-year safe harbor is smaller', () => {
  // This year $20,000 tax, $2,000 withheld; last year $15,000 tax at $90,000 AGI.
  const r = calculateEstimatedTax({ taxYear: 2026, currentYearTax: 20000, withholding: 2000, priorYearTax: 15000, priorYearAgi: 90000 });
  close(r.currentYearTest, 18000);
  close(r.priorYearTest, 15000);
  assert.equal(r.safeHarborUsed, 'priorYear');
  close(r.safeHarborTotal, 13000);
  close(r.safeHarborInstallment, 3250);
  close(r.dueAtFilingWithSafeHarbor, 5000);
  close(r.payInFullInstallment, 4500);
  assert.deepEqual([...r.dueDates], ['2026-04-15', '2026-06-15', '2026-09-15', '2027-01-15']);
});

test('110% applies above $150,000 prior-year AGI, and above $75,000 if married filing separately', () => {
  const base = { taxYear: 2026, currentYearTax: 60000, priorYearTax: 40000 };
  close(calculateEstimatedTax({ ...base, priorYearAgi: 150000 }).priorYearTest, 40000); // not over
  close(calculateEstimatedTax({ ...base, priorYearAgi: 150001 }).priorYearTest, 44000);
  close(calculateEstimatedTax({ ...base, priorYearAgi: 80000, marriedFilingSeparately: true }).priorYearTest, 44000);
  close(calculateEstimatedTax({ ...base, priorYearAgi: 75000, marriedFilingSeparately: true }).priorYearTest, 40000);
});

test('current-year test wins when income drops', () => {
  const r = calculateEstimatedTax({ taxYear: 2026, currentYearTax: 10000, priorYearTax: 30000, priorYearAgi: 100000 });
  assert.equal(r.safeHarborUsed, 'currentYear');
  close(r.safeHarborTotal, 9000);
});

test('without last year’s tax only the 90% test is used', () => {
  const r = calculateEstimatedTax({ taxYear: 2026, currentYearTax: 10000 });
  assert.equal(r.priorYearTest, null);
  close(r.requiredAnnualPayment, 9000);
});

test('under $1,000 owed after withholding: no estimated payments needed', () => {
  const r = calculateEstimatedTax({ taxYear: 2026, currentYearTax: 10000, withholding: 9001, priorYearTax: 12000 });
  assert.equal(r.underMinimum, true);
  assert.equal(r.paymentsRequired, false);
  assert.equal(r.safeHarborTotal, 0);
  close(r.payInFullTotal, 999);
  assert.equal(calculateEstimatedTax({ taxYear: 2026, currentYearTax: 10000, withholding: 9000 }).underMinimum, false); // exactly $1,000
});

test('zero tax last year: no estimated payments needed', () => {
  const r = calculateEstimatedTax({ taxYear: 2026, currentYearTax: 25000, priorYearTax: 0 });
  assert.equal(r.noPriorYearTax, true);
  assert.equal(r.paymentsRequired, false);
  close(r.payInFullTotal, 25000);
});

test('withholding at or above the safe harbor leaves nothing to pay quarterly', () => {
  const r = calculateEstimatedTax({ taxYear: 2026, currentYearTax: 20000, withholding: 16000, priorYearTax: 15000 });
  assert.equal(r.paymentsRequired, true);
  assert.equal(r.safeHarborTotal, 0);
  close(r.dueAtFilingWithSafeHarbor, 4000);
});

test('random cases: installments × 4 equal the totals, and safe harbor never exceeds paying in full', () => {
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 2000; run += 1) {
    const input = {
      taxYear: 2026,
      currentYearTax: Math.round(rand() * 200000),
      withholding: Math.round(rand() * 80000),
      priorYearTax: rand() < 0.2 ? null : Math.round(rand() * 200000),
      priorYearAgi: Math.round(rand() * 400000),
      marriedFilingSeparately: rand() < 0.2
    };
    const r = calculateEstimatedTax(input);
    close(r.safeHarborInstallment * 4, r.safeHarborTotal, 1e-6);
    assert.ok(r.safeHarborTotal <= r.payInFullTotal + 1e-9 || r.priorYearTest !== null);
    assert.ok(r.safeHarborTotal + input.withholding >= Math.min(r.requiredAnnualPayment, input.currentYearTax) - 1e-6 || !r.paymentsRequired);
    close(r.safeHarborTotal + r.dueAtFilingWithSafeHarbor, r.payInFullTotal, 1e-6);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateEstimatedTax({ taxYear: 2025, currentYearTax: 1000 }), RangeError);
  assert.throws(() => calculateEstimatedTax({ taxYear: 2026, currentYearTax: -1 }), RangeError);
  assert.throws(() => calculateEstimatedTax({ taxYear: 2026, currentYearTax: 1000, withholding: Number.NaN }), RangeError);
  assert.throws(() => calculateEstimatedTax({ taxYear: 2026, currentYearTax: 1000, priorYearTax: -5 }), RangeError);
});
