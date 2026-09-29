import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateAutoLoan } from '../src/calculators/auto-loan.js';
import { calculateAutoLoanAffordability } from '../src/calculators/auto-loan-affordability.js';

test('reverses a standard auto loan with tax and fees', () => {
  const result = calculateAutoLoanAffordability({
    monthlyBudget: 500,
    annualRate: 6,
    termMonths: 60,
    downPayment: 5000,
    salesTaxRate: 7,
    fees: 500
  });

  const forward = calculateAutoLoan({
    vehiclePrice: result.vehiclePrice,
    downPayment: 5000,
    salesTaxRate: 7,
    fees: 500,
    annualRate: 6,
    termMonths: 60
  });

  assert.ok(result.vehiclePrice > 0);
  // Independent closed form in Python: (500 × (1 − 1.005^−60) ÷ 0.005 + 5,000 − 500) ÷ 1.07.
  assert.ok(Math.abs(result.vehiclePrice - 28376.43025753783) < 1e-6);
  assert.ok(Math.abs(forward.monthlyPayment - 500) < 1e-9);
  assert.ok(Math.abs(result.amountFinanced - forward.amountFinanced) < 1e-9);
});

test('reverses tax-after-trade-in treatment', () => {
  const result = calculateAutoLoanAffordability({
    monthlyBudget: 600,
    annualRate: 7,
    termMonths: 60,
    downPayment: 3000,
    tradeInValue: 8000,
    tradeInPayoff: 10000,
    salesTaxRate: 8,
    fees: 500,
    taxAfterTradeIn: true
  });

  const forward = calculateAutoLoan({
    vehiclePrice: result.vehiclePrice,
    downPayment: 3000,
    tradeInValue: 8000,
    tradeInPayoff: 10000,
    salesTaxRate: 8,
    fees: 500,
    taxAfterTradeIn: true,
    annualRate: 7,
    termMonths: 60
  });

  assert.ok(Math.abs(forward.monthlyPayment - 600) < 1e-9);
  assert.ok(Math.abs(result.salesTax - forward.salesTax) < 1e-9);
});

test('handles zero APR exactly', () => {
  const result = calculateAutoLoanAffordability({
    monthlyBudget: 500,
    annualRate: 0,
    termMonths: 60,
    downPayment: 2000
  });

  assert.equal(result.vehiclePrice, 32000);
  assert.equal(result.amountFinanced, 30000);
  assert.equal(result.monthlyPayment, 500);
});

test('handles negative trade equity without distorting the inverse', () => {
  const result = calculateAutoLoanAffordability({
    monthlyBudget: 500,
    annualRate: 6,
    termMonths: 60,
    tradeInValue: 8000,
    tradeInPayoff: 10000,
    salesTaxRate: 7
  });

  const forward = calculateAutoLoan({
    vehiclePrice: result.vehiclePrice,
    tradeInValue: 8000,
    tradeInPayoff: 10000,
    salesTaxRate: 7,
    annualRate: 6,
    termMonths: 60
  });

  assert.ok(Math.abs(forward.monthlyPayment - 500) < 1e-9);
});

test('rejects non-positive budgets and invalid terms', () => {
  assert.throws(() => calculateAutoLoanAffordability({
    monthlyBudget: 0,
    annualRate: 6,
    termMonths: 60
  }), /monthlyBudget must be greater than 0/);

  assert.throws(() => calculateAutoLoanAffordability({
    monthlyBudget: 500,
    annualRate: 6,
    termMonths: 0
  }), /termMonths must be a positive integer/);
});

// Round trip over varied inputs: the forward engine at the solved price must
// reproduce the budget, and a dollar more must cost more than the budget.
test('solved prices round-trip through the forward engine for 300 varied loans', () => {
  for (let i = 0; i < 300; i += 1) {
    const input = {
      monthlyBudget: 150 + (i * 37) % 1400,
      annualRate: ((i * 53) % 2000) / 100,
      termMonths: [24, 36, 48, 60, 72, 84][i % 6],
      downPayment: (i * 211) % 8000,
      tradeInValue: (i * 379) % 15000,
      tradeInPayoff: (i * 157) % 12000,
      salesTaxRate: ((i * 29) % 1000) / 100,
      fees: (i * 43) % 1500,
      taxAfterTradeIn: i % 2 === 0
    };
    let result;
    try {
      result = calculateAutoLoanAffordability(input);
    } catch (error) {
      assert.ok(error instanceof RangeError);
      continue;
    }
    const { monthlyBudget, ...purchase } = input;
    const forward = calculateAutoLoan({ ...purchase, vehiclePrice: result.vehiclePrice });
    assert.ok(Math.abs(forward.monthlyPayment - monthlyBudget) < 1e-6, `case ${i}`);
    const dearer = calculateAutoLoan({ ...purchase, vehiclePrice: result.vehiclePrice + 1 });
    assert.ok(dearer.monthlyPayment > monthlyBudget, `case ${i} could afford more`);
  }
});
