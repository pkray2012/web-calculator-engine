import test from 'node:test';
import assert from 'node:assert/strict';

import { parseRefiForm, runRefiCalculator, REFI_DEFAULTS } from '../../src/adapters/mortgage-refinance.js';
import { refinanceResults, aheadText } from '../../src/components/refinance-results.js';
import { refinanceForm } from '../../src/components/refinance-form.js';
import { formatCurrency } from '../../src/lib/format.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent month-by-month reference, written without the engines:
// cost at month m = payments made through m + balance still owed.
function costs(principal, rate, months, horizon) {
  const r = rate / 1200;
  const payment = r === 0 ? principal / months : principal * r / (1 - (1 + r) ** -months);
  let balance = principal;
  let paid = 0;
  const out = [];
  for (let m = 1; m <= horizon; m += 1) {
    if (m <= months && balance > 1e-9) {
      const interest = balance * r;
      const toPrincipal = Math.min(balance, payment - interest);
      balance -= toPrincipal;
      paid += toPrincipal + interest;
    }
    out.push(paid + balance);
  }
  return out;
}

function reference(values) {
  const { input } = parseRefiForm({ ...REFI_DEFAULTS, ...values });
  const horizon = Math.max(input.currentTermMonths, input.newTermMonths);
  const current = costs(input.currentBalance, input.currentRate, input.currentTermMonths, horizon);
  const refi = costs(input.currentBalance + (input.financeClosingCosts ? input.closingCosts : 0), input.newRate, input.newTermMonths, horizon);
  const upfront = input.financeClosingCosts ? 0 : input.closingCosts;
  const net = current.map((cost, i) => cost - (refi[i] + upfront));
  return { net, firstAhead: net.findIndex((v) => v > 0) + 1 };
}

function view(values) {
  const result = runRefiCalculator({ ...REFI_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example matches the independent simulation', () => {
  const result = view({});
  const ref = reference({});
  assert.equal(result.aheadWindow.fromMonth, ref.firstAhead);
  close(result.lifetimeSavings, ref.net.at(-1));
  close(result.stay.netSavings, ref.net[result.stay.months - 1]);
  for (const row of result.horizon) close(row.netSavings, ref.net[row.month - 1]);
});

test('term reset with financed costs is reported as never ahead', () => {
  const values = { currentBalance: '300000', currentRate: '6.5', currentTermValue: '25', newRate: '6', newTermValue: '30', closingCosts: '8000', financeClosingCosts: 'on' };
  const result = view(values);
  assert.equal(result.aheadWindow, null);
  assert.equal(reference(values).firstAhead, 0);
  assert.equal(aheadText(result), 'Never ahead within the loan terms');
  assert.match(String(refinanceResults(result)), /This refinance never comes out ahead/);
});

test('shorter term: payment rises but the refinance still breaks even', () => {
  const result = view({ currentBalance: '250000', currentRate: '6.75', currentTermValue: '20', newRate: '5.25', newTermValue: '15', closingCosts: '5000', stayYears: '' });
  assert.ok(result.monthlySavings < 0);
  assert.equal(result.simpleBreakEvenMonths, null);
  assert.equal(result.aheadWindow.fromMonth, 16);
  assert.equal(result.stay, null);
  assert.match(String(refinanceResults(result)), /Monthly payment increase/);
});

test('an ahead-then-behind window is described as temporary', () => {
  const result = view({ currentBalance: '300000', currentRate: '7', currentTermValue: '25', newRate: '6', newTermValue: '30', closingCosts: '6000', financeClosingCosts: 'on' });
  assert.ok(result.aheadWindow.untilMonth !== null);
  assert.match(aheadText(result), /^Months \d+–\d+ only$/);
  assert.match(String(refinanceResults(result)), /Ahead only for a while/);
});

test('horizon rows cover checkpoints up to the longer term plus the planned stay', () => {
  const result = view({ stayYears: '4.5' });
  const months = result.horizon.map((row) => row.month);
  assert.deepEqual(months, [12, 24, 36, 54, 60, 84, 120, 180, 240, 300, 360]);
  assert.equal(result.horizon.find((row) => row.isStay).month, 54);
});

test('zero closing costs and zero rates calculate', () => {
  const result = view({ closingCosts: '0', newRate: '0' });
  assert.equal(result.aheadWindow.fromMonth, 1);
  assert.equal(result.refinance.totalInterest, 0);
});

test('invalid inputs produce field-specific messages', () => {
  const parsed = parseRefiForm({
    ...REFI_DEFAULTS, currentBalance: '0', currentRate: '31', currentTermValue: '41', newRate: 'x', newTermValue: '2.51', closingCosts: '-1', stayYears: 'soon'
  });
  assert.deepEqual(parsed.errors, {
    currentBalance: 'Current loan balance must be greater than 0.',
    currentRate: 'Current interest rate must be 30 or less.',
    currentTermValue: 'Time left on current loan must be 40 or less.',
    newRate: 'New interest rate must be a number.',
    newTermValue: 'New loan term in years must convert to whole months (for example 2.5 years).',
    closingCosts: 'Closing costs cannot be negative.',
    stayYears: 'Time you expect to keep the loan must be a number.'
  });
});

test('largest allowed inputs stay finite', () => {
  const result = view({ currentBalance: '10000000', currentRate: '30', currentTermValue: '40', newRate: '30', newTermValue: '480', newTermUnit: 'months', closingCosts: '1000000', financeClosingCosts: 'on' });
  assert.ok(Number.isFinite(result.refinance.payment));
  assert.ok(Number.isFinite(result.lifetimeSavings));
});

test('results label every key figure and state the table basis', () => {
  const result = view({});
  const markup = String(refinanceResults(result));
  for (const label of ['New monthly payment', 'Monthly savings', 'True break-even', 'Simple break-even', 'Lifetime net savings']) {
    assert.match(markup, new RegExp(`<dt class="stat__label">${label}</dt>`));
  }
  assert.ok(markup.includes(formatCurrency(result.refinance.payment)));
  assert.match(markup, /payments made so far, plus the balance you would still owe, plus closing costs paid in cash/);
  assert.match(markup, /<th scope="col" class="num">Refinance ahead by<\/th>/);
  assert.doesNotMatch(markup, /&quot;|NaN|Infinity|undefined/);
});

test('form labels every field', () => {
  const markup = String(refinanceForm());
  for (const id of ['current-balance', 'current-rate', 'current-term', 'current-term-unit', 'new-rate', 'new-term', 'new-term-unit', 'closing-costs', 'finance-closing-costs', 'stay-years']) {
    assert.match(markup, new RegExp(`<label[^>]*for="${id}"`));
  }
});

test('the simple break-even figure is identical in the results and the page copy', async () => {
  const { mortgageRefinancePage } = await import('../../src/pages/mortgage-refinance-calculator.js');
  const page = String(mortgageRefinancePage().body);
  const figure = view({}).simpleBreakEvenMonths.toFixed(1);
  assert.match(page, new RegExp(`<dd class="stat__value">${figure} months</dd>`));
  assert.match(page, new RegExp(`= ${figure} months`));
  const table = page.slice(page.indexOf('id="horizon-table"'));
  assert.match(table, /<th scope="col">After<\/th><th scope="col" class="num">Refinance ahead by<\/th>/);
});
