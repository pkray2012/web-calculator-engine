import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRentVsBuy } from '../src/calculators/rent-vs-buy.js';

const base = {
  homePrice: 400000, downPayment: 40000, annualRate: 6.5, termMonths: 360, years: 10,
  buyClosingCostPercent: 3, sellingCostPercent: 6, propertyTaxPercent: 1.1, insuranceYearly: 1800,
  maintenancePercent: 1, pmiRate: 0.5, appreciationPercent: 3, monthlyRent: 2200, rentIncreasePercent: 3,
  rentersInsuranceMonthly: 15, investmentReturnPercent: 5
};

// Reference net worths from an independent Python month-by-month simulation
// written without the engines (amortization, PMI months and growth recomputed).
const REFERENCE = [
  [1, 31303.811688, 67730.845976],
  [5, 98887.533147, 132982.518312],
  [10, 200118.503727, 217609.880538]
];

test('net worth each year matches the independent simulation', () => {
  const { rows } = calculateRentVsBuy(base);
  assert.equal(rows.length, 10);
  for (const [year, buyer, renter] of REFERENCE) {
    const row = rows[year - 1];
    assert.ok(Math.abs(row.buyerNetWorth - buyer) < 1e-5, `buyer year ${year}`);
    assert.ok(Math.abs(row.renterNetWorth - renter) < 1e-5, `renter year ${year}`);
  }
});

test('both paths spend the same cash: costs plus investments reconcile', () => {
  // With 0% investment return, each side's cash out equals the other side's cash out plus what it invested.
  const { rows, upfront } = calculateRentVsBuy({ ...base, investmentReturnPercent: 0 });
  for (const row of rows) {
    const renterInvested = row.renterNetWorth - upfront;
    assert.ok(Math.abs(row.buyerCosts - upfront + row.buyerInvestments - (row.renterCosts + renterInvested)) < 1e-6, `year ${row.year}`);
  }
});

test('faster appreciation brings the break-even year forward', () => {
  const slow = calculateRentVsBuy({ ...base, years: 30 });
  const fast = calculateRentVsBuy({ ...base, years: 30, appreciationPercent: 5 });
  assert.ok(fast.breakevenYear !== null);
  assert.ok(slow.breakevenYear === null || fast.breakevenYear < slow.breakevenYear);
  assert.ok(fast.advantage > slow.advantage);
});

test('cheap rent and strong returns favor renting; expensive rent favors buying', () => {
  assert.ok(calculateRentVsBuy({ ...base, monthlyRent: 1200, investmentReturnPercent: 8 }).advantage < 0);
  assert.ok(calculateRentVsBuy({ ...base, monthlyRent: 4500 }).advantage > 0);
});

test('a paid-off loan leaves only owner costs', () => {
  const { rows } = calculateRentVsBuy({ ...base, termMonths: 60, years: 7 });
  assert.equal(rows[4].loanBalance < 1e-6, true);
  assert.equal(rows[6].loanBalance, 0);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateRentVsBuy({ ...base, years: 0 }), RangeError);
  assert.throws(() => calculateRentVsBuy({ ...base, monthlyRent: -1 }), RangeError);
  assert.throws(() => calculateRentVsBuy({ ...base, appreciationPercent: -100 }), RangeError);
  assert.throws(() => calculateRentVsBuy({ ...base, downPayment: 400000 }), RangeError);
});
