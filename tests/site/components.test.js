import test from 'node:test';
import assert from 'node:assert/strict';

import { html, raw, escapeHtml, jsonLd } from '../../src/lib/html.js';
import { formatCurrency, formatDuration, paymentMonth, formatMonth } from '../../src/lib/format.js';
import { parseNumber } from '../../src/lib/validation.js';
import { numberField, amountWithUnitField, errorSummary } from '../../src/components/fields.js';
import { dataTable } from '../../src/components/results.js';
import { loanResults } from '../../src/components/loan-results.js';
import { loanForm } from '../../src/components/loan-form.js';
import { relatedLinks } from '../../src/components/layout.js';
import { relatedCalculators, CALCULATORS } from '../../src/content/site.js';
import { buildLoanView, parseLoanForm, LOAN_DEFAULTS } from '../../src/adapters/loan-payment.js';

test('html escapes interpolated text but not nested fragments', () => {
  const out = String(html`<p title="${'"x"'}">${'<script>'}${html`<b>ok</b>`}${raw('<i>raw</i>')}</p>`);
  assert.equal(out, '<p title="&quot;x&quot;">&lt;script&gt;<b>ok</b><i>raw</i></p>');
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.match(String(jsonLd({ a: '</script>' })), /\\u003c\/script>/);
});

test('conditional attributes render as markup, not escaped text', () => {
  const field = String(numberField({ id: 'x', name: 'x', label: 'X', value: '1', error: 'Bad' }));
  assert.match(field, / aria-invalid="true"/);
  assert.doesNotMatch(field, /&quot;/);
  const table = String(dataTable({
    id: 't', title: 'T', columns: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B', numeric: true }],
    rows: [{ a: '1', b: '2', selected: true }]
  }));
  assert.match(table, /<td class="num">2<\/td>/);
  assert.match(table, /<tr class="is-selected" aria-current="true">/);
  assert.doesNotMatch(table, /&quot;/);
});

test('user-entered values are escaped inside inputs', () => {
  const form = String(loanForm({ ...LOAN_DEFAULTS, principal: '"><script>alert(1)</script>' }));
  assert.doesNotMatch(form, /<script>alert/);
  assert.match(form, /value="&quot;&gt;&lt;script&gt;/);
});

test('fields wire labels, hints and errors for assistive technology', () => {
  const field = String(numberField({ id: 'rate', name: 'rate', label: 'Rate', value: '5', hint: 'Yearly', suffix: '%' }));
  assert.match(field, /<label for="rate">Rate<\/label>/);
  assert.match(field, /aria-describedby="rate-hint rate-error"/);
  assert.match(field, /<p class="field__error" id="rate-error" hidden>/);
  assert.match(field, / required>/);

  const group = String(amountWithUnitField({
    id: 'term', name: 't', unitName: 'u', legend: 'Loan term', value: '5', unit: 'months',
    units: [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }]
  }));
  assert.match(group, /<legend>Loan term<\/legend>/);
  assert.match(group, /<label class="visually-hidden" for="term-unit">/);
  assert.match(group, /<option value="months" selected>/);
});

test('error summary links each message to its field', () => {
  const out = String(errorSummary({ principal: 'Loan amount is required.' }, { principal: 'principal' }));
  assert.match(out, /role="alert"/);
  assert.match(out, /<a href="#principal">Loan amount is required\.<\/a>/);
  assert.equal(String(errorSummary({}, {})), '');
});

test('tables are named by a visible title and use header scopes', () => {
  const out = String(dataTable({
    id: 'sched', title: 'Schedule', columns: [{ key: 'y', label: 'Year' }, { key: 'v', label: 'Value', numeric: true }],
    rows: [{ y: 'Year 1', v: '$1.00' }]
  }));
  assert.match(out, /<p class="table-title" id="sched-title">Schedule<\/p>/);
  assert.match(out, /role="region" aria-labelledby="sched-title" tabindex="0"/);
  assert.match(out, /<th scope="col">Year<\/th>/);
  assert.match(out, /<th scope="row">Year 1<\/th>/);
});

test('loan results show every headline figure and both schedules', () => {
  const view = buildLoanView(parseLoanForm({ ...LOAN_DEFAULTS, extraMonthly: '100' }).input);
  const out = String(loanResults(view));
  for (const value of [view.monthlyPayment, view.totalInterest, view.totalRepayment, view.extra.interestSaved]) {
    assert.ok(out.includes(formatCurrency(value)), `missing ${formatCurrency(value)}`);
  }
  assert.match(out, /id="schedule-yearly"/);
  assert.match(out, /id="schedule-monthly"/);
  assert.match(out, /id="term-table"/);
  assert.match(out, /including your extra payment/);
  assert.equal((out.match(/<h2 /g) ?? []).length, 4);
});

test('related links render only live calculators', () => {
  // Planned calculators never produce links; live ones do (the registry case below).
  assert.deepEqual(relatedCalculators('loan-payment-calculator').map((calc) => calc.slug), ['auto-loan-calculator', 'personal-loan-calculator', 'mortgage-refinance-calculator', 'heloc-payment-calculator', 'loan-payoff-calculator']);
  assert.deepEqual(relatedCalculators('mortgage-refinance-calculator').map((calc) => calc.slug), ['mortgage-calculator', 'mortgage-points-calculator', 'loan-payment-calculator', 'heloc-payment-calculator', 'home-equity-loan-calculator']);
  assert.deepEqual(relatedCalculators('home-equity-loan-calculator').map((calc) => calc.slug), ['heloc-payment-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']);
  assert.deepEqual(relatedCalculators('home-affordability-calculator').map((calc) => calc.slug), ['mortgage-calculator', 'debt-to-income-calculator', 'rent-vs-buy-calculator', 'loan-payoff-calculator', 'mortgage-points-calculator']);
  assert.deepEqual(relatedCalculators('heloc-payment-calculator').map((calc) => calc.slug), ['home-equity-loan-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']);
  assert.deepEqual(relatedCalculators('mortgage-calculator').map((calc) => calc.slug), ['home-affordability-calculator', 'mortgage-refinance-calculator', 'mortgage-points-calculator', 'loan-payoff-calculator']);
  assert.deepEqual(relatedCalculators('mortgage-points-calculator').map((calc) => calc.slug), ['mortgage-refinance-calculator', 'loan-payment-calculator']);
  assert.deepEqual(relatedCalculators('auto-loan-calculator').map((calc) => calc.slug), ['car-lease-calculator', 'auto-loan-refinance-calculator', 'loan-payment-calculator', 'personal-loan-calculator', 'loan-payoff-calculator']);
  assert.deepEqual(relatedCalculators('auto-loan-refinance-calculator').map((calc) => calc.slug), ['auto-loan-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']);
  assert.deepEqual(relatedCalculators('loan-payoff-calculator').map((calc) => calc.slug), ['loan-payment-calculator', 'mortgage-refinance-calculator', 'auto-loan-calculator']);
  assert.deepEqual(relatedCalculators('personal-loan-calculator').map((calc) => calc.slug), ['loan-payment-calculator', 'auto-loan-calculator', 'credit-card-payoff-calculator', 'student-loan-refinance-calculator']);
  assert.deepEqual(relatedCalculators('student-loan-refinance-calculator').map((calc) => calc.slug), ['loan-payment-calculator', 'personal-loan-calculator']);
  assert.deepEqual(relatedCalculators('credit-card-payoff-calculator').map((calc) => calc.slug), ['balance-transfer-calculator', 'personal-loan-calculator', 'loan-payment-calculator']);
  assert.deepEqual(relatedCalculators('balance-transfer-calculator').map((calc) => calc.slug), ['credit-card-payoff-calculator', 'personal-loan-calculator']);
  assert.equal(String(relatedLinks([])), '');

  const registry = [
    { ...CALCULATORS.find((calc) => calc.slug === 'loan-payment-calculator') },
    { slug: 'auto-loan-calculator', name: 'Auto Loan Calculator', status: 'live', path: '/calculators/auto-loan-calculator/', summary: 'Car payments.' },
    { slug: 'personal-loan-calculator', name: 'Personal Loan Calculator', status: 'planned' }
  ];
  const related = relatedCalculators('loan-payment-calculator', registry);
  assert.deepEqual(related.map((calc) => calc.slug), ['auto-loan-calculator']);
  assert.match(String(relatedLinks(related)), /<a class="card__link" href="\/calculators\/auto-loan-calculator\/">Auto Loan Calculator<\/a>/);
});

test('formatting helpers', () => {
  assert.equal(formatCurrency(1896.2), '$1,896.20');
  assert.equal(formatCurrency(-0.001), '$0.00');
  assert.equal(formatDuration(67), '5 years, 7 months');
  assert.equal(formatDuration(12), '1 year');
  assert.equal(formatDuration(1), '1 month');
  assert.deepEqual(paymentMonth({ year: 2026, month: 11 }, 3), { year: 2027, month: 1 });
  assert.equal(formatMonth({ year: 2027, month: 1 }), 'January 2027');
  assert.equal(parseNumber(' $1,234.50 '), 1234.5);
  assert.ok(Number.isNaN(parseNumber('12abc')));
  assert.ok(Number.isNaN(parseNumber('')));
});
