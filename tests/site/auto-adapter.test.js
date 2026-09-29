import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAutoForm, buildAutoView, runAutoCalculator, AUTO_DEFAULTS } from '../../src/adapters/auto-loan.js';
import { autoLoanResults } from '../../src/components/auto-loan-results.js';
import { autoLoanForm } from '../../src/components/auto-loan-form.js';
import { formatCurrency } from '../../src/lib/format.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent reference, written without the engines.
function reference({ price, down = 0, tradeValue = 0, tradePayoff = 0, taxRate = 0, taxAfterTrade = false, fees = 0, apr, months }) {
  const taxBase = taxAfterTrade ? Math.max(0, price - tradeValue) : price;
  const financed = price + taxBase * taxRate / 100 + fees - down - (tradeValue - tradePayoff);
  const r = apr / 1200;
  const payment = r === 0 ? financed / months : financed * r / (1 - (1 + r) ** -months);
  return { financed, payment };
}

function view(values) {
  const result = runAutoCalculator({ ...AUTO_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches the independent reference', () => {
  const result = view({});
  const ref = reference({ price: 35000, down: 5000, taxRate: 6, apr: 7, months: 60 });
  close(result.purchase.amountFinanced, ref.financed);
  close(result.monthlyPayment, ref.payment);
  close(result.purchase.amountFinanced, 32100);
  close(result.monthlyPayment, 635.62, 0.005);
});

test('trade-in equity with tax on the full price vs after the trade-in', () => {
  const inputs = { vehiclePrice: '35000', downPayment: '5000', tradeInValue: '8000', tradeInPayoff: '3000', salesTaxRate: '7', fees: '800', annualRate: '6.9', termMonths: '60' };
  const full = view(inputs);
  const credited = view({ ...inputs, taxAfterTradeIn: 'on' });
  close(full.purchase.amountFinanced, 28250);
  close(credited.purchase.amountFinanced, 27690);
  close(credited.monthlyPayment, reference({ price: 35000, down: 5000, tradeValue: 8000, tradePayoff: 3000, taxRate: 7, taxAfterTrade: true, fees: 800, apr: 6.9, months: 60 }).payment);
  assert.ok(credited.monthlyPayment < full.monthlyPayment);
});

test('negative equity is added to the amount financed and flagged', () => {
  const result = view({ tradeInValue: '5000', tradeInPayoff: '9000' });
  assert.equal(result.purchase.netTradeIn, -4000);
  close(result.purchase.amountFinanced, 32100 + 4000);
  const markup = String(autoLoanResults(result));
  assert.match(markup, /Negative equity:/);
  assert.match(markup, /Negative equity rolled into the loan/);
  assert.doesNotMatch(String(autoLoanResults(view({}))), /Negative equity/);
});

test('car cost counts price, tax, fees and interest but not old debt', () => {
  const result = view({ fees: '600', tradeInValue: '5000', tradeInPayoff: '9000' });
  const { purchase } = result;
  close(purchase.carCostWithInterest, 35000 + 2100 + 600 + result.totalInterest);
});

test('term comparison covers common terms plus a custom term', () => {
  assert.deepEqual(view({}).termComparison.map((row) => row.termMonths), [36, 48, 60, 72, 84]);
  const custom = view({ termMonths: '66' }).termComparison;
  assert.deepEqual(custom.map((row) => row.termMonths), [36, 48, 60, 66, 72, 84]);
  assert.equal(custom.find((row) => row.selected).termMonths, 66);
  const selected = custom.find((row) => row.selected);
  const current = view({ termMonths: '66' });
  close(selected.monthlyPayment, current.monthlyPayment);
});

test('a down payment covering tax and fees is allowed; covering everything is a field error', () => {
  const ok = view({ vehiclePrice: '20000', downPayment: '20500', salesTaxRate: '7', fees: '1000', termMonths: '24' });
  close(ok.purchase.amountFinanced, 1900);
  const tooMuch = runAutoCalculator({ ...AUTO_DEFAULTS, vehiclePrice: '20000', downPayment: '21200', salesTaxRate: '6' });
  assert.equal(tooMuch.ok, false);
  assert.match(tooMuch.errors.downPayment, /nothing to finance/);
});

test('blank optional amounts count as zero; the tax checkbox reads "on"', () => {
  const parsed = parseAutoForm({ ...AUTO_DEFAULTS, downPayment: '', tradeInValue: '', tradeInPayoff: '', fees: '', salesTaxRate: '', taxAfterTradeIn: 'on' });
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    [parsed.input.downPayment, parsed.input.tradeInValue, parsed.input.tradeInPayoff, parsed.input.fees, parsed.input.salesTaxRate],
    [0, 0, 0, 0, 0]
  );
  assert.equal(parsed.input.taxAfterTradeIn, true);
  assert.equal(parseAutoForm(AUTO_DEFAULTS).input.taxAfterTradeIn, false);
});

test('rejects invalid purchase and loan inputs with field messages', () => {
  const parsed = parseAutoForm({
    ...AUTO_DEFAULTS, vehiclePrice: '0', downPayment: '-1', salesTaxRate: '25', annualRate: '', termMonths: '60.5', startMonth: 'soon'
  });
  assert.equal(parsed.ok, false);
  assert.deepEqual(parsed.errors, {
    vehiclePrice: 'Vehicle price must be greater than 0.',
    downPayment: 'Down payment cannot be negative.',
    salesTaxRate: 'Sales tax rate must be 20 or less.',
    annualRate: 'APR is required.',
    termMonths: 'Loan term must be a whole number.',
    startMonth: 'First payment month must be a month like 2026-10.'
  });
  assert.match(parseAutoForm({ ...AUTO_DEFAULTS, termMonths: '121' }).errors.termMonths, /120 or less/);
});

test('zero APR finances with no interest', () => {
  const result = view({ annualRate: '0', termMonths: '60' });
  assert.equal(result.totalInterest, 0);
  close(result.monthlyPayment, 32100 / 60);
});

test('results markup shows the amount-financed bridge and headline figures', () => {
  const result = buildAutoView(parseAutoForm({ ...AUTO_DEFAULTS, fees: '750', tradeInValue: '6000', tradeInPayoff: '2000' }).input);
  const markup = String(autoLoanResults(result));
  for (const value of [result.monthlyPayment, result.purchase.amountFinanced, result.purchase.salesTax, result.totalInterest]) {
    assert.ok(markup.includes(formatCurrency(value)), `missing ${formatCurrency(value)}`);
  }
  assert.match(markup, /Trade-in equity \(value − amount owed\)/);
  assert.match(markup, /Sales tax \(6% of full price\)/);
  assert.match(markup, /id="financed-table"/);
  assert.doesNotMatch(markup, /&quot;/);
});

test('form renders every field with a label and keeps the checkbox state', () => {
  const unchecked = String(autoLoanForm());
  assert.match(unchecked, /<input id="tax-after-trade-in" name="taxAfterTradeIn" type="checkbox" aria-describedby="tax-after-trade-in-hint">/);
  const checked = String(autoLoanForm({ ...AUTO_DEFAULTS, taxAfterTradeIn: 'on' }));
  assert.match(checked, /type="checkbox" checked/);
  for (const id of ['vehicle-price', 'down-payment', 'trade-in-value', 'trade-in-payoff', 'sales-tax-rate', 'fees', 'apr', 'term-months', 'extra-monthly', 'start-month']) {
    assert.match(unchecked, new RegExp(`<label for="${id}">`));
  }
});

test('budget mode solves the price whose payment equals the budget', () => {
  const result = view({ mode: 'budget', monthlyBudget: '600' });
  // Independent: (600 × (1 − (1 + 0.07/12)^−60) ÷ (0.07/12) + 5,000) ÷ 1.06.
  close(result.budget.vehiclePrice, 33303.015189338475);
  close(result.monthlyPayment, 600);
  const check = reference({ price: result.budget.vehiclePrice, down: 5000, taxRate: 6, apr: 7, months: 60 });
  close(check.payment, 600);
  close(result.purchase.amountFinanced, check.financed);
});

test('budget mode ignores the price field, validates the budget and explains a budget that is too small', () => {
  assert.equal(parseAutoForm({ ...AUTO_DEFAULTS, mode: 'budget', vehiclePrice: '' }).ok, true);
  assert.equal(parseAutoForm({ ...AUTO_DEFAULTS, mode: 'price', monthlyBudget: '' }).ok, true);
  assert.deepEqual(parseAutoForm({ ...AUTO_DEFAULTS, mode: 'budget', monthlyBudget: '0' }).errors, { monthlyBudget: 'Monthly budget must be greater than 0.' });
  const tooSmall = runAutoCalculator({ ...AUTO_DEFAULTS, mode: 'budget', monthlyBudget: '20', downPayment: '0', fees: '3000' });
  assert.equal(tooSmall.ok, false);
  assert.match(tooSmall.errors.monthlyBudget, /does not cover the fees/);
});

test('budget mode results lead with the affordable price; price mode does not', () => {
  const budgetMarkup = String(autoLoanResults(view({ mode: 'budget' })));
  assert.match(budgetMarkup, /supports a car price of about <strong>\$33,303<\/strong>/);
  assert.doesNotMatch(String(autoLoanResults(view({}))), /supports a car price/);
  const form = String(autoLoanForm({ ...AUTO_DEFAULTS, mode: 'budget' }));
  assert.match(form, /id="auto-mode-budget"[^>]*checked/);
  assert.match(form, /for="monthly-budget"/);
});
