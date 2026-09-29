import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDebtToIncome } from '../src/calculators/debt-to-income.js';

test('the CFPB worked example: $2,000 of payments on $6,000 of income is about 33%', () => {
  // CFPB: $1,500 mortgage + $100 auto loan + $400 other debts, $6,000 gross monthly income.
  const result = calculateDebtToIncome({
    grossMonthlyIncome: 6000, housingPayment: 1500,
    otherDebts: [{ label: 'Auto loan', amount: 100 }, { label: 'Other debts', amount: 400 }]
  });
  assert.equal(result.totalDebt, 2000);
  assert.ok(Math.abs(result.backEndPercent - 100 / 3) < 1e-12);
  assert.equal(result.frontEndPercent, 25);
  assert.ok(Math.abs(result.roomForNewPayment - 160) < 1e-9);
  assert.equal(result.reductionNeeded, 0);
});

test('over the target: the payment to cut brings the ratio exactly to the target', () => {
  const input = { grossMonthlyIncome: 5000, housingPayment: 1600, otherDebts: [{ label: 'Card', amount: 450 }, { label: 'Car', amount: 380 }], targetPercent: 43 };
  const result = calculateDebtToIncome(input);
  assert.ok(Math.abs(result.reductionNeeded - 280) < 1e-9);
  assert.equal(result.roomForNewPayment, 0);
  const after = calculateDebtToIncome({ ...input, otherDebts: [{ label: 'Card', amount: 450 - 280 }, { label: 'Car', amount: 380 }] });
  assert.ok(Math.abs(after.backEndPercent - 43) < 1e-9);
});

test('shares list only debts with a payment', () => {
  const result = calculateDebtToIncome({ grossMonthlyIncome: 4000, otherDebts: [{ label: 'A', amount: 200 }, { label: 'B', amount: 0 }] });
  assert.deepEqual(result.shares.map((share) => [share.label, share.percentOfIncome]), [['A', 5]]);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateDebtToIncome({ grossMonthlyIncome: 0 }), RangeError);
  assert.throws(() => calculateDebtToIncome({ grossMonthlyIncome: 1000, housingPayment: -1 }), RangeError);
  assert.throws(() => calculateDebtToIncome({ grossMonthlyIncome: 1000, otherDebts: [{ label: 'x', amount: Number.NaN }] }), RangeError);
});
