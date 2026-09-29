import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAutoLoan } from '../src/calculators/auto-loan.js';

test('calculates financed amount with down payment, trade-in and fees', () => {
  const result = calculateAutoLoan({
    vehiclePrice: 30000,
    downPayment: 5000,
    tradeInValue: 4000,
    tradeInPayoff: 2000,
    salesTaxRate: 7,
    fees: 500,
    annualRate: 6.5,
    termMonths: 60
  });

  assert.equal(result.netTradeIn, 2000);
  assert.equal(result.salesTax, 2100);
  assert.equal(result.amountFinanced, 25600);
  assert.ok(Math.abs(result.monthlyPayment - 500.89) < 0.02);
});

test('supports trade-in tax reduction explicitly', () => {
  const taxedAfterTrade = calculateAutoLoan({
    vehiclePrice: 30000,
    tradeInValue: 10000,
    salesTaxRate: 8,
    annualRate: 6,
    termMonths: 60,
    taxAfterTradeIn: true
  });
  const taxedBeforeTrade = calculateAutoLoan({
    vehiclePrice: 30000,
    tradeInValue: 10000,
    salesTaxRate: 8,
    annualRate: 6,
    termMonths: 60,
    taxAfterTradeIn: false
  });

  assert.equal(taxedAfterTrade.salesTax, 1600);
  assert.equal(taxedBeforeTrade.salesTax, 2400);
  assert.equal(taxedAfterTrade.amountFinanced, 21600);
  assert.equal(taxedBeforeTrade.amountFinanced, 22400);
});

test('negative trade-in equity increases amount financed', () => {
  const result = calculateAutoLoan({
    vehiclePrice: 25000,
    tradeInValue: 8000,
    tradeInPayoff: 10000,
    annualRate: 7,
    termMonths: 60
  });

  assert.equal(result.netTradeIn, -2000);
  assert.equal(result.amountFinanced, 27000);
});

test('extra payment reduces auto-loan interest and payoff time', () => {
  const result = calculateAutoLoan({
    vehiclePrice: 35000,
    downPayment: 5000,
    annualRate: 6.5,
    termMonths: 72,
    extraMonthly: 100
  });

  assert.ok(result.accelerated.payments < result.scheduledPayments);
  assert.ok(result.accelerated.totalInterest < result.totalInterest);
});

test('rejects invalid auto-loan inputs', () => {
  assert.throws(() => calculateAutoLoan({ vehiclePrice: 0, annualRate: 6, termMonths: 60 }), /vehiclePrice/);
  assert.throws(() => calculateAutoLoan({ vehiclePrice: 30000, downPayment: -1, annualRate: 6, termMonths: 60 }), /downPayment/);
  assert.throws(() => calculateAutoLoan({ vehiclePrice: 30000, salesTaxRate: -1, annualRate: 6, termMonths: 60 }), /salesTaxRate/);
  assert.throws(() => calculateAutoLoan({ vehiclePrice: 30000, downPayment: 31000, annualRate: 6, termMonths: 60 }), /downPayment/);
});

test('a down payment may also cover sales tax and fees', () => {
  // $20,000 + 7% tax ($1,400) + $1,000 fees - $20,500 down = $1,900 financed.
  const result = calculateAutoLoan({
    vehiclePrice: 20000,
    downPayment: 20500,
    salesTaxRate: 7,
    fees: 1000,
    annualRate: 6,
    termMonths: 24
  });
  assert.ok(Math.abs(result.amountFinanced - 1900) < 1e-9);
});

test('a down payment that covers the whole purchase is rejected', () => {
  assert.throws(() => calculateAutoLoan({
    vehiclePrice: 20000, downPayment: 21400, salesTaxRate: 7, annualRate: 6, termMonths: 24
  }), /downPayment/);
});
