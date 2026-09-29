import test from 'node:test';
import assert from 'node:assert/strict';
import { compareAutoLoanTerms } from '../src/calculators/auto-loan-term-comparison.js';

test('compares requested auto-loan terms using shared financing inputs', () => {
  const result = compareAutoLoanTerms({ vehiclePrice: 30000, downPayment: 5000, tradeInValue: 4000, tradeInPayoff: 2000, salesTaxRate: 7, fees: 500, annualRate: 6.5, terms: [60, 48, 72] });
  assert.equal(result.baselineTerm, 48);
  assert.equal(result.amountFinanced, 25600);
  assert.deepEqual(result.rows.map((row) => row.termMonths), [60, 48, 72]);
  const fortyEight = result.rows[1]; const seventyTwo = result.rows[2];
  assert.ok(seventyTwo.monthlyPayment < fortyEight.monthlyPayment);
  assert.ok(seventyTwo.totalInterest > fortyEight.totalInterest);
  assert.equal(fortyEight.interestDeltaVsShortestTerm, 0);
  assert.equal(fortyEight.monthlyPaymentDeltaVsShortestTerm, 0);
});

test('preserves negative-equity and tax assumptions through the shared engine', () => {
  const result = compareAutoLoanTerms({ vehiclePrice: 25000, tradeInValue: 8000, tradeInPayoff: 10000, salesTaxRate: 8, taxAfterTradeIn: true, annualRate: 7, terms: [60, 72] });
  assert.equal(result.amountFinanced, 28360);
  assert.ok(result.rows[1].totalInterest > result.rows[0].totalInterest);
});

test('rejects missing, duplicate, and invalid terms', () => {
  assert.throws(() => compareAutoLoanTerms({ vehiclePrice: 30000, annualRate: 6, terms: [] }), /terms/);
  assert.throws(() => compareAutoLoanTerms({ vehiclePrice: 30000, annualRate: 6, terms: [60, 60] }), /duplicates/);
  assert.throws(() => compareAutoLoanTerms({ vehiclePrice: 30000, annualRate: 6, terms: [60, 0] }), /positive integer/);
});
