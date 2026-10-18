import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateRentAffordability, costBurdenLevel } from '../src/calculators/rent-affordability.js';

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test('hand-checked: $60,000 a year with $150 utilities', () => {
  const r = calculateRentAffordability({ annualGrossIncome: 60000, monthlyUtilities: 150 });
  close(r.grossMonthly, 5000);
  close(r.guidelineHousingCost, 1500);
  close(r.guidelineRent, 1350);
  close(r.severeRent, 2350);
  close(r.screenRent, 1500);
  close(r.lowestRent, 1350);
});

test('the 30% rule and the 40× screen agree when utilities are zero (12 ÷ 40 = 30%)', () => {
  for (const income of [24000, 60000, 137500]) {
    const r = calculateRentAffordability({ annualGrossIncome: income });
    close(r.guidelineRent, r.screenRent, 1e-9);
  }
});

test('budget view: take-home minus debts, essentials, savings and utilities', () => {
  const r = calculateRentAffordability({ annualGrossIncome: 60000, monthlyUtilities: 150, monthlyTakeHome: 3900, monthlyDebts: 400, monthlyEssentials: 1200, monthlySavings: 500 });
  close(r.budget.leftForHousing, 1800);
  close(r.budget.rent, 1650);
  close(r.lowestRent, 1350);
});

test('a budget with nothing left gives zero rent, not a negative one', () => {
  const r = calculateRentAffordability({ annualGrossIncome: 30000, monthlyTakeHome: 2000, monthlyDebts: 2500 });
  close(r.budget.leftForHousing, -500);
  assert.equal(r.budget.rent, 0);
  assert.equal(r.lowestRent, 0);
});

test('utilities above the 30% share leave no rent under the guideline', () => {
  const r = calculateRentAffordability({ annualGrossIncome: 12000, monthlyUtilities: 400 });
  assert.equal(r.guidelineRent, 0);
});

test('a considered rent gets its burden level and the income the screen needs', () => {
  const r = calculateRentAffordability({ annualGrossIncome: 60000, monthlyUtilities: 150, rentConsidered: 1700, monthlyTakeHome: 3900 });
  close(r.considered.burdenPercent, 37);
  assert.equal(r.considered.burdenLevel, 'burdened');
  close(r.considered.incomeNeededForScreen, 68000);
  assert.equal(r.considered.passesScreen, false);
  close(r.considered.leftAfterHousing, 3900 - 150 - 1700);
});

test('burden levels: 30% and 50% of monthly income are the upper edges of each band', () => {
  assert.equal(costBurdenLevel(1500, 5000), 'none');
  assert.equal(costBurdenLevel(1500.01, 5000), 'burdened');
  assert.equal(costBurdenLevel(2500, 5000), 'burdened');
  assert.equal(costBurdenLevel(2500.01, 5000), 'severe');
});

test('a displayed maximum entered back in always passes its own test (review A4-001, A4-002)', () => {
  let checked = 0;
  for (let income = 10000; income <= 200000; income += 97) {
    for (const utilities of [0, 37.5, 150, 333.33]) {
      for (const multiple of [36, 40, 45]) {
        const limits = calculateRentAffordability({ annualGrossIncome: income, monthlyUtilities: utilities, incomeMultiple: multiple });
        if (limits.guidelineRent > 0) {
          const back = calculateRentAffordability({ annualGrossIncome: income, monthlyUtilities: utilities, incomeMultiple: multiple, rentConsidered: limits.guidelineRent });
          assert.equal(back.considered.burdenLevel, 'none', `income ${income}, utilities ${utilities}`);
        }
        const screened = calculateRentAffordability({ annualGrossIncome: income, monthlyUtilities: utilities, incomeMultiple: multiple, rentConsidered: limits.screenRent });
        assert.equal(screened.considered.passesScreen, true, `income ${income}, multiple ${multiple}`);
        // and one cent more fails the screen
        const over = calculateRentAffordability({ annualGrossIncome: income, incomeMultiple: multiple, rentConsidered: limits.screenRent + 0.01 });
        assert.equal(over.considered.passesScreen, false, `income ${income}, multiple ${multiple} +1¢`);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 20000);
});

test('the reviewer’s cases: $12,400 at 30% and $60,001 at 40×', () => {
  const a = calculateRentAffordability({ annualGrossIncome: 12400, rentConsidered: 310 });
  assert.equal(a.considered.burdenLevel, 'none');
  const b = calculateRentAffordability({ annualGrossIncome: 60001 });
  assert.equal(b.screenRent, 1500.02);
  assert.equal(calculateRentAffordability({ annualGrossIncome: 60001, rentConsidered: 1500.02 }).considered.passesScreen, true);
});

test('zero income: no division by zero', () => {
  const r = calculateRentAffordability({ annualGrossIncome: 0, rentConsidered: 1000 });
  assert.equal(r.guidelineRent, 0);
  assert.equal(r.considered.burdenPercent, null);
  assert.equal(r.considered.passesScreen, false);
});

test('custom share and multiple', () => {
  const r = calculateRentAffordability({ annualGrossIncome: 90000, housingSharePercent: 25, incomeMultiple: 36 });
  close(r.guidelineRent, 1875);
  close(r.screenRent, 2500);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateRentAffordability({ annualGrossIncome: -1 }), RangeError);
  assert.throws(() => calculateRentAffordability({ annualGrossIncome: 1000, housingSharePercent: 101 }), RangeError);
  assert.throws(() => calculateRentAffordability({ annualGrossIncome: 1000, incomeMultiple: 0 }), RangeError);
  assert.throws(() => calculateRentAffordability({ annualGrossIncome: 1000, monthlyDebts: Number.NaN }), RangeError);
  assert.throws(() => calculateRentAffordability({ annualGrossIncome: 1000, rentConsidered: -5 }), RangeError);
});
