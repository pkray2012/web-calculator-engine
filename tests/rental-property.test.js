import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateRentalProperty } from '../src/calculators/rental-property.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

const EXAMPLE = {
  purchasePrice: 300000, downPaymentPercent: 25, closingCosts: 9000, repairCosts: 6000, interestRate: 7, termYears: 30,
  monthlyRent: 2400, vacancyPercent: 5, propertyTaxYearly: 3600, insuranceYearly: 1500,
  maintenancePercent: 8, capexPercent: 5, managementPercent: 5
};

// Independent reference, written without the engines (annuity payment included).
function reference(input) {
  const i = { closingCosts: 0, repairCosts: 0, otherMonthlyIncome: 0, vacancyPercent: 0, propertyTaxYearly: 0, insuranceYearly: 0,
    hoaMonthly: 0, utilitiesMonthly: 0, maintenancePercent: 0, capexPercent: 0, managementPercent: 0, ...input };
  const loan = i.purchasePrice * (1 - i.downPaymentPercent / 100);
  const r = i.interestRate / 1200;
  const n = i.termYears * 12;
  const pmt = loan === 0 ? 0 : r === 0 ? loan / n : loan * r / (1 - (1 + r) ** -n);
  const egi = 12 * (i.monthlyRent + i.otherMonthlyIncome) * (1 - i.vacancyPercent / 100);
  const opex = i.propertyTaxYearly + i.insuranceYearly + 12 * (i.hoaMonthly + i.utilitiesMonthly)
    + egi * (i.maintenancePercent + i.capexPercent + i.managementPercent) / 100;
  const noi = egi - opex;
  const cashFlow = noi - 12 * pmt;
  const invested = i.purchasePrice - loan + i.closingCosts + i.repairCosts;
  return { noi, cashFlow, cap: noi / i.purchasePrice, coc: invested > 0 ? cashFlow / invested : null, dscr: pmt > 0 ? noi / (12 * pmt) : null };
}

test('hand-checked example: $300,000, 25% down, 7% for 30 years, $2,400 rent', () => {
  const r = calculateRentalProperty(EXAMPLE);
  close(r.loanAmount, 225000);
  close(r.monthlyDebtPayment, 1496.93, 0.005);
  close(r.grossScheduledIncome, 28800);
  close(r.effectiveGrossIncome, 27360);
  close(r.expenses.maintenance, 2188.8);
  close(r.operatingExpenses, 10024.8);
  close(r.netOperatingIncome, 17335.2);
  close(r.capRate, 0.057784);
  close(r.annualCashFlow, -627.97, 0.005);
  close(r.cashInvested, 90000);
  close(r.cashOnCash, -627.9673698379447 / 90000, 1e-9);
  close(r.dscr, 17335.2 / 17963.167369837945, 1e-9);
  close(r.grossRentMultiplier, 300000 / 28800);
});

test('cash flow is zero at the break-even rent', () => {
  const r = calculateRentalProperty(EXAMPLE);
  close(r.breakEvenRent, 2467.18, 0.005);
  const atBreakEven = calculateRentalProperty({ ...EXAMPLE, monthlyRent: r.breakEvenRent });
  close(atBreakEven.annualCashFlow, 0, 1e-6);
});

test('other income lowers the break-even rent one for one', () => {
  const base = calculateRentalProperty(EXAMPLE);
  const withParking = calculateRentalProperty({ ...EXAMPLE, otherMonthlyIncome: 100 });
  close(base.breakEvenRent - withParking.breakEvenRent, 100, 1e-9);
});

test('an all-cash purchase has no debt service, DSCR or loan', () => {
  const r = calculateRentalProperty({ ...EXAMPLE, downPaymentPercent: 100, termYears: Number.NaN });
  assert.equal(r.loanAmount, 0);
  assert.equal(r.annualDebtService, 0);
  assert.equal(r.dscr, null);
  close(r.annualCashFlow, r.netOperatingIncome);
  close(r.cashOnCash, r.netOperatingIncome / 315000);
});

test('debt service is excluded from NOI: financing changes cash flow, not NOI or cap rate', () => {
  const a = calculateRentalProperty(EXAMPLE);
  const b = calculateRentalProperty({ ...EXAMPLE, downPaymentPercent: 50, interestRate: 5 });
  close(a.netOperatingIncome, b.netOperatingIncome);
  close(a.capRate, b.capRate);
  assert.ok(b.annualCashFlow > a.annualCashFlow);
});

test('percentage expenses are taken on collected income, so vacancy lowers them', () => {
  const full = calculateRentalProperty({ ...EXAMPLE, vacancyPercent: 0 });
  const half = calculateRentalProperty({ ...EXAMPLE, vacancyPercent: 50 });
  close(half.expenses.management, full.expenses.management / 2);
});

test('break-even rent is unavailable when vacancy or percentage costs take all income', () => {
  assert.equal(calculateRentalProperty({ ...EXAMPLE, vacancyPercent: 100 }).breakEvenRent, null);
  assert.equal(calculateRentalProperty({ ...EXAMPLE, maintenancePercent: 50, capexPercent: 30, managementPercent: 20 }).breakEvenRent, null);
});

test('zero rent gives no GRM or expense ratio instead of dividing by zero', () => {
  const r = calculateRentalProperty({ ...EXAMPLE, monthlyRent: 0 });
  assert.equal(r.grossRentMultiplier, null);
  assert.equal(r.expenseRatio, null);
  assert.ok(Number.isFinite(r.annualCashFlow));
});

test('random deals match the independent reference', () => {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 1000; run += 1) {
    const input = {
      purchasePrice: Math.round(50000 + rand() * 1950000),
      downPaymentPercent: [0, 3.5, 10, 20, 25, 30, 100][Math.floor(rand() * 7)],
      closingCosts: Math.round(rand() * 30000),
      repairCosts: Math.round(rand() * 50000),
      interestRate: Math.round(rand() * 1200) / 100,
      termYears: [15, 20, 30][Math.floor(rand() * 3)],
      monthlyRent: Math.round(rand() * 12000),
      otherMonthlyIncome: Math.round(rand() * 300),
      vacancyPercent: Math.round(rand() * 20),
      propertyTaxYearly: Math.round(rand() * 25000),
      insuranceYearly: Math.round(rand() * 6000),
      hoaMonthly: rand() < 0.3 ? Math.round(rand() * 600) : 0,
      utilitiesMonthly: rand() < 0.3 ? Math.round(rand() * 300) : 0,
      maintenancePercent: Math.round(rand() * 15),
      capexPercent: Math.round(rand() * 10),
      managementPercent: rand() < 0.5 ? 0 : Math.round(rand() * 12)
    };
    const r = calculateRentalProperty(input);
    const ref = reference(input);
    close(r.netOperatingIncome, ref.noi, 1e-6);
    close(r.annualCashFlow, ref.cashFlow, 1e-6);
    close(r.capRate, ref.cap, 1e-12);
    if (ref.dscr === null) assert.equal(r.dscr, null); else close(r.dscr, ref.dscr, 1e-9);
    close(r.cashOnCash, ref.coc, 1e-9);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateRentalProperty({ ...EXAMPLE, purchasePrice: 0 }), RangeError);
  assert.throws(() => calculateRentalProperty({ ...EXAMPLE, downPaymentPercent: 120 }), RangeError);
  assert.throws(() => calculateRentalProperty({ ...EXAMPLE, vacancyPercent: -1 }), RangeError);
  assert.throws(() => calculateRentalProperty({ ...EXAMPLE, termYears: 0 }), RangeError);
  assert.throws(() => calculateRentalProperty({ ...EXAMPLE, monthlyRent: Number.NaN }), RangeError);
  assert.throws(() => calculateRentalProperty({ ...EXAMPLE, interestRate: -1 }), RangeError);
});
