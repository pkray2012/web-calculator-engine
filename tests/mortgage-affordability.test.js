import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMortgageAffordability, calculateAffordabilityPlan } from '../src/calculators/mortgage-affordability.js';

const base = {
  annualIncome: 120000,
  monthlyDebt: 500,
  downPayment: 60000,
  annualRate: 6.5,
  termYears: 30,
  frontEndRatio: 0.28,
  backEndRatio: 0.36,
  annualPropertyTax: 6000,
  annualInsurance: 1800,
  monthlyHoa: 0,
  annualPmiRate: 0.7
};

test('solves maximum home price against the tighter housing ratio', () => {
  const result = calculateMortgageAffordability(base);
  assert.ok(Math.abs(result.maxHomePrice - 371413.0612) < 0.01);
  assert.ok(Math.abs(result.monthlyHousingCost - 2800) < 0.000001);
  assert.ok(Math.abs(result.frontEndDti - 28) < 0.000001);
});

test('higher monthly debt cannot increase affordability', () => {
  const lowDebt = calculateMortgageAffordability({ ...base, monthlyDebt: 500 });
  const highDebt = calculateMortgageAffordability({ ...base, monthlyDebt: 1500 });
  assert.ok(highDebt.maxHomePrice < lowDebt.maxHomePrice);
});

test('higher income cannot reduce affordability', () => {
  const lowerIncome = calculateMortgageAffordability(base);
  const higherIncome = calculateMortgageAffordability({ ...base, annualIncome: 150000 });
  assert.ok(higherIncome.maxHomePrice > lowerIncome.maxHomePrice);
});

test('PMI disappears when loan-to-value reaches 80 percent', () => {
  const result = calculateMortgageAffordability({ ...base, downPayment: 100000 });
  assert.equal(result.pmi, 0);
  assert.ok(result.loanToValue <= 80);
});

test('zero interest remains finite and solvable', () => {
  const result = calculateMortgageAffordability({ ...base, annualRate: 0 });
  assert.ok(Number.isFinite(result.maxHomePrice));
  assert.ok(result.maxHomePrice > 600000);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateMortgageAffordability({ ...base, annualIncome: 0 }), RangeError);
  assert.throws(() => calculateMortgageAffordability({ ...base, frontEndRatio: 1.2 }), RangeError);
  assert.throws(() => calculateMortgageAffordability({ ...base, monthlyDebt: -1 }), RangeError);
});

// Reference prices below come from an independent Python bisection with the
// closed-form payment, written separately from the engine.
const taxRateCase = { ...base, annualPropertyTax: 0, propertyTaxRate: 1.1 };
const backEndCase = {
  annualIncome: 90000, monthlyDebt: 900, downPayment: 30000, annualRate: 7, termYears: 30,
  frontEndRatio: 0.28, backEndRatio: 0.36, annualPropertyTax: 0, propertyTaxRate: 1.2,
  annualInsurance: 1500, monthlyHoa: 100, annualPmiRate: 0.5
};

test('a property tax rate scales tax with the solved price', () => {
  const result = calculateMortgageAffordability(taxRateCase);
  assert.ok(Math.abs(result.maxHomePrice - 391812.5690) < 0.01);
  assert.ok(Math.abs(result.propertyTax - result.maxHomePrice * 0.011 / 12) < 1e-9);
  assert.ok(Math.abs(result.monthlyHousingCost - 2800) < 1e-6);
});

test('the back-end ratio binds when other debts are high, and paying them off raises the price', () => {
  const plan = calculateAffordabilityPlan(backEndCase);
  assert.equal(plan.binding, 'back');
  assert.ok(Math.abs(plan.housingPaymentCap - 1800) < 1e-9);
  assert.ok(Math.abs(plan.maxHomePrice - 221457.1303) < 0.01);
  assert.ok(Math.abs(plan.withoutDebt.maxHomePrice - 258633.2722) < 0.01);
  assert.ok(Math.abs(plan.backEndDti - 36) < 1e-6);
});

test('front-end binding plans have no debt-free scenario', () => {
  const plan = calculateAffordabilityPlan(taxRateCase);
  assert.equal(plan.binding, 'front');
  assert.equal(plan.withoutDebt, null);
});

test('rate scenarios are one point either side and ordered by price', () => {
  const plan = calculateAffordabilityPlan(taxRateCase);
  assert.deepEqual(plan.rateScenarios.map((row) => row.annualRate), [5.5, 6.5, 7.5]);
  assert.equal(plan.rateScenarios[1].maxHomePrice, plan.maxHomePrice);
  assert.ok(plan.rateScenarios[0].maxHomePrice > plan.rateScenarios[1].maxHomePrice);
  assert.ok(plan.rateScenarios[1].maxHomePrice > plan.rateScenarios[2].maxHomePrice);
  assert.deepEqual(calculateAffordabilityPlan({ ...base, annualRate: 0.5 }).rateScenarios.map((row) => row.annualRate), [0.5, 1.5]);
});

test('fixed costs above the budget give a zero price instead of an overspent one', () => {
  const result = calculateMortgageAffordability({ ...base, annualInsurance: 40000 });
  assert.equal(result.maxHomePrice, 0);
});

function independentCost(input, price) {
  const loan = Math.max(0, price - input.downPayment);
  const r = input.annualRate / 1200;
  const n = input.termYears * 12;
  const payment = loan === 0 ? 0 : r === 0 ? loan / n : loan * r / (1 - (1 + r) ** -n);
  const pmi = loan / price > 0.8 ? loan * input.annualPmiRate / 1200 : 0;
  return payment + price * input.propertyTaxRate / 1200 + input.annualInsurance / 12 + input.monthlyHoa + pmi;
}

test('the solved price is the largest that fits: one dollar more exceeds the budget', () => {
  for (let i = 0; i < 200; i += 1) {
    const input = {
      ...base,
      annualIncome: 40000 + (i * 7919) % 260000,
      monthlyDebt: (i * 131) % 2500,
      downPayment: (i * 3571) % 150000,
      annualRate: ((i * 37) % 900) / 100,
      termYears: [15, 20, 30][i % 3],
      annualPropertyTax: 0,
      propertyTaxRate: ((i * 13) % 250) / 100,
      annualInsurance: 600 + (i * 97) % 3000,
      monthlyHoa: (i * 17) % 300,
      annualPmiRate: ((i * 7) % 150) / 100
    };
    const result = calculateMortgageAffordability(input);
    if (result.maxHomePrice === 0) continue;
    assert.ok(Math.abs(independentCost(input, result.maxHomePrice) - result.monthlyHousingCost) < 1e-6, `case ${i} cost differs`);
    assert.ok(result.monthlyHousingCost <= result.housingPaymentCap + 1e-6, `case ${i} overspends`);
    assert.ok(independentCost(input, result.maxHomePrice + 1) > result.housingPaymentCap, `case ${i} could afford more`);
  }
});

test('negative property tax rates are rejected', () => {
  assert.throws(() => calculateMortgageAffordability({ ...base, propertyTaxRate: -1 }), RangeError);
});
