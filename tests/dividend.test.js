import test from 'node:test';
import assert from 'node:assert/strict';
import { projectDividends, investmentForIncome } from '../src/calculators/dividend.js';

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

test('reinvested annual dividends compound like interest: 10,000 at 4% for 10 years', () => {
  const result = projectDividends({ initialInvestment: 10_000, dividendYield: 4, years: 10, frequency: 1 });
  close(result.endingValue, 10_000 * 1.04 ** 10);
  close(result.totalDividends, 10_000 * 1.04 ** 10 - 10_000);
  assert.equal(result.schedule.length, 10);
});

test('quarterly reinvestment compounds four times a year', () => {
  const result = projectDividends({ initialInvestment: 10_000, dividendYield: 4, years: 10, frequency: 4 });
  close(result.endingValue, 10_000 * 1.01 ** 40);
});

test('without reinvestment, dividends are paid out as cash', () => {
  const result = projectDividends({ initialInvestment: 10_000, dividendYield: 4, years: 10, reinvest: false });
  close(result.cash, 4000);
  close(result.holdingValue, 10_000);
  close(result.endingValue, 14_000);
  close(result.nextYearIncome, 400);
  close(result.yieldOnCost, 4);
});

test('dividend growth raises the payout at the start of each year after the first', () => {
  const result = projectDividends({ initialInvestment: 10_000, dividendYield: 4, years: 10, dividendGrowth: 5, frequency: 1, reinvest: false });
  close(result.schedule[0].dividends, 400);
  close(result.schedule[1].dividends, 420);
  close(result.totalDividends, 5031.157014219533);
  close(result.finalYearDividends, 400 * 1.05 ** 9);
});

test('price growth alone grows the holding, compounded monthly', () => {
  const result = projectDividends({ initialInvestment: 10_000, dividendYield: 0, years: 10, priceGrowth: 5 });
  close(result.endingValue, 10_000 * 1.05 ** 10, 1e-6);
  assert.equal(result.totalDividends, 0);
});

// Reference from an independent Python month-by-month simulation.
test('contributions, growth, taxes and quarterly reinvestment together', () => {
  const result = projectDividends({ initialInvestment: 10_000, dividendYield: 3, years: 20, monthlyContribution: 200, dividendGrowth: 6, priceGrowth: 5, frequency: 4, taxRate: 15 });
  close(result.endingValue, 159595.09544098208, 1e-6);
  close(result.totalDividends, 43857.79274033177, 1e-6);
  close(result.totalTaxes, 43857.79274033177 * 0.15, 1e-6);
  close(result.contributed, 10_000 + 200 * 240);
  close(result.nextYearIncome, 5787.248345192039, 1e-6);
});

test('investment needed for a target income is income ÷ yield', () => {
  close(investmentForIncome({ annualIncome: 12_000, dividendYield: 4 }), 300_000);
  assert.throws(() => investmentForIncome({ annualIncome: 1000, dividendYield: 0 }), RangeError);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => projectDividends({ initialInvestment: 0, dividendYield: 4, years: 10 }), RangeError);
  assert.throws(() => projectDividends({ initialInvestment: 1000, dividendYield: 4, years: 0 }), RangeError);
  assert.throws(() => projectDividends({ initialInvestment: 1000, dividendYield: 4, years: 2.5 }), RangeError);
  // @ts-expect-error unsupported frequency
  assert.throws(() => projectDividends({ initialInvestment: 1000, dividendYield: 4, years: 5, frequency: 3 }), RangeError);
  assert.throws(() => projectDividends({ initialInvestment: 1000, dividendYield: -1, years: 5 }), RangeError);
  assert.throws(() => projectDividends({ initialInvestment: 1000, dividendYield: 4, years: 5, taxRate: 101 }), RangeError);
});
