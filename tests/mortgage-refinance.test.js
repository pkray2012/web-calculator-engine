import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMortgageRefinance } from '../src/calculators/mortgage-refinance.js';

test('calculates payment savings and break-even for a lower-rate refinance', () => {
  const result = calculateMortgageRefinance({
    currentBalance: 300000,
    currentAPR: 7,
    currentTermMonths: 300,
    newAPR: 5.5,
    newTermMonths: 360,
    closingCosts: 6000
  });

  assert.ok(result.monthlySavings > 0);
  assert.ok(result.breakEvenMonths > 0);
  assert.ok(Math.abs(result.breakEvenMonths * result.monthlySavings - 6000) < 1e-9);
  assert.equal(result.termResetWarning, true);
});

test('exposes the longer-term cost of restarting the mortgage clock', () => {
  const result = calculateMortgageRefinance({
    currentBalance: 250000,
    currentAPR: 6.5,
    currentTermMonths: 300,
    newAPR: 5.5,
    newTermMonths: 360,
    closingCosts: 5000
  });

  assert.ok(result.newMonthlyPayment < result.currentMonthlyPayment);
  assert.ok(result.payoffMonthsChange > 0);
  assert.equal(result.termResetWarning, true);
});

test('supports financing closing costs', () => {
  const result = calculateMortgageRefinance({
    currentBalance: 200000,
    currentAPR: 7,
    currentTermMonths: 240,
    newAPR: 5.5,
    newTermMonths: 240,
    closingCosts: 4000,
    financeClosingCosts: true
  });

  assert.equal(result.newPrincipal, 204000);
  assert.ok(result.newMonthlyPayment > 0);
});

test('evaluates the planned stay against break-even', () => {
  const result = calculateMortgageRefinance({
    currentBalance: 300000,
    currentAPR: 7,
    currentTermMonths: 300,
    newAPR: 5.5,
    newTermMonths: 300,
    closingCosts: 5000,
    plannedStayMonths: 60
  });

  assert.equal(result.stayPeriod.months, 60);
  assert.equal(result.stayPeriod.reachesBreakEven, result.stayPeriod.months >= result.breakEvenMonths);
});

test('rejects invalid mortgage refinance inputs', () => {
  assert.throws(() => calculateMortgageRefinance({
    currentBalance: 0,
    currentAPR: 7,
    currentTermMonths: 300,
    newAPR: 5.5,
    newTermMonths: 300
  }), /currentBalance/);
});

// Reference values below come from an independent month-by-month simulation
// (payments made through the stay + balance owed at the stay + cash closing costs).
function stay(overrides) {
  return calculateMortgageRefinance({
    currentBalance: 300000,
    currentAPR: 7,
    currentTermMonths: 300,
    newAPR: 6,
    newTermMonths: 300,
    closingCosts: 6000,
    plannedStayMonths: 60,
    ...overrides
  }).stayPeriod;
}

test('planned-stay savings include the balance still owed at the stay', () => {
  const result = stay({});
  assert.ok(Math.abs(result.netSavings - 8936.20) < 0.01);
  assert.ok(result.refinanceBalanceAtStay < result.currentBalanceAtStay);
  assert.ok(Math.abs(result.currentCost - result.refinanceCost - result.netSavings) < 1e-9);
});

test('planned-stay savings are not inflated by a term reset with financed costs', () => {
  const result = stay({ newTermMonths: 360, financeClosingCosts: true });
  assert.ok(Math.abs(result.netSavings - 5882.90) < 0.01);
});

test('a term-reset refinance can lose money over a short stay despite lower payments', () => {
  const result = calculateMortgageRefinance({
    currentBalance: 300000,
    currentAPR: 6.5,
    currentTermMonths: 300,
    newAPR: 6,
    newTermMonths: 360,
    closingCosts: 8000,
    financeClosingCosts: true,
    plannedStayMonths: 36
  });

  assert.ok(result.monthlySavings > 0);
  assert.ok(Math.abs(result.stayPeriod.netSavings - -5372.03) < 0.01);
  assert.equal(result.stayPeriod.reachesBreakEven, false);
});

test('a planned stay beyond both terms matches lifetime savings', () => {
  const result = calculateMortgageRefinance({
    currentBalance: 100000,
    currentAPR: 6,
    currentTermMonths: 120,
    newAPR: 5,
    newTermMonths: 120,
    closingCosts: 3000,
    plannedStayMonths: 180
  });

  assert.ok(Math.abs(result.stayPeriod.netSavings - 2945.98) < 0.01);
  assert.ok(Math.abs(result.stayPeriod.netSavings - result.netLifetimeSavings) < 1e-6);
  assert.ok(result.stayPeriod.currentBalanceAtStay <= 0.005);
  assert.ok(result.stayPeriod.refinanceBalanceAtStay <= 0.005);
});

// "True" break-even counts the balance still owed, not just payment savings.
// Reference months come from the independent month-by-month script used above.
function refi(overrides) {
  return calculateMortgageRefinance({
    currentBalance: 300000,
    currentAPR: 7,
    currentTermMonths: 300,
    newAPR: 6,
    newTermMonths: 300,
    closingCosts: 6000,
    ...overrides
  });
}

test('true break-even is earlier than simple break-even when the rate drop also speeds up payoff', () => {
  const result = refi({});
  assert.ok(Math.abs(result.breakEvenMonths - 32.011) < 0.001); // $6,000 ÷ $187.43 a month
  assert.equal(result.aheadWindow.fromMonth, 25);
  assert.equal(result.aheadWindow.untilMonth, null);
});

test('a term reset with financed costs can never come out ahead despite a lower payment', () => {
  const result = refi({ currentAPR: 6.5, newAPR: 6, newTermMonths: 360, closingCosts: 8000, financeClosingCosts: true });
  assert.ok(result.monthlySavings > 0);
  assert.ok(Number.isFinite(result.breakEvenMonths));
  assert.equal(result.aheadWindow, null);
});

test('a term reset can be ahead only for a window before falling behind', () => {
  const result = refi({ newTermMonths: 360, financeClosingCosts: true });
  assert.equal(result.aheadWindow.fromMonth, 29);
  assert.ok(result.aheadWindow.untilMonth > 29 && result.aheadWindow.untilMonth < 300);
  assert.ok(result.netLifetimeSavings < 0);
  const inside = result.netSavingsAt(result.aheadWindow.untilMonth);
  const after = result.netSavingsAt(result.aheadWindow.untilMonth + 1);
  assert.ok(inside > 0 && after <= 0);
});

test('a shorter-term refinance can break even even though the payment rises', () => {
  const result = calculateMortgageRefinance({
    currentBalance: 250000, currentAPR: 6.75, currentTermMonths: 240,
    newAPR: 5.25, newTermMonths: 180, closingCosts: 5000
  });
  assert.ok(result.monthlySavings < 0);
  assert.equal(result.breakEvenMonths, Infinity);
  assert.equal(result.aheadWindow.fromMonth, 16);
});

test('net savings at a month match the planned-stay analysis and lifetime savings at the end', () => {
  const result = refi({ newTermMonths: 360, financeClosingCosts: true, plannedStayMonths: 60 });
  assert.ok(Math.abs(result.netSavingsAt(60) - result.stayPeriod.netSavings) < 1e-6);
  assert.ok(Math.abs(result.netSavingsAt(360) - result.netLifetimeSavings) < 1e-6);
  assert.throws(() => result.netSavingsAt(0), /month/);
});

test('positionAt reports payments made, balance owed and cost for both options', () => {
  const result = refi({ financeClosingCosts: false, plannedStayMonths: 60 });
  const at60 = result.positionAt(60);
  assert.ok(Math.abs(at60.current.balance - result.stayPeriod.currentBalanceAtStay) < 1e-6);
  assert.ok(Math.abs(at60.refinance.balance - result.stayPeriod.refinanceBalanceAtStay) < 1e-6);
  assert.ok(Math.abs(at60.refinance.paid - result.stayPeriod.refinancePayments) < 1e-6); // includes $6,000 cash costs
  assert.ok(Math.abs(at60.current.cost - at60.refinance.cost - at60.netSavings) < 1e-9);
  assert.equal(result.positionAt(10000).month, result.horizonMonths);
});
