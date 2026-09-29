/**
 * Results panel for the Home Affordability Calculator. Pure function of the
 * view model from src/adapters/mortgage-affordability.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

function summary(view) {
  return statGrid([
    { label: 'Home price you could afford', value: formatCurrencyWhole(view.maxHomePrice), primary: true, note: `With ${formatCurrencyWhole(view.input.downPayment)} down (${formatPercent(view.downPaymentPercent, 1)})` },
    { label: 'Monthly housing payment', value: formatCurrency(view.monthlyHousingCost), note: 'Principal, interest, taxes, insurance, PMI and HOA' },
    { label: 'Loan amount', value: formatCurrencyWhole(view.loanAmount), note: `${formatPercent(view.loanToValue, 1)} of the price (loan-to-value)` },
    { label: 'Debt-to-income', value: `${formatPercent(view.frontEndDti, 1)} / ${formatPercent(view.backEndDti, 1)}`, note: 'Housing only / housing plus other debts' }
  ]);
}

function limitBlock(view) {
  const { input } = view;
  if (view.binding === 'front') {
    return html`<p class="callout">Your <strong>housing limit</strong> sets the budget: ${formatPercent(input.frontEndRatio, 1)} of
    ${formatCurrency(view.grossMonthlyIncome)} gross monthly income is <strong>${formatCurrency(view.frontEndCap)}</strong> a month for housing.
    Your total debt limit would allow ${formatCurrency(view.backEndCap)}, so your other debts do not reduce the price here.</p>`;
  }
  const gain = view.withoutDebt ? view.withoutDebt.maxHomePrice - view.maxHomePrice : 0;
  return html`<p class="callout">Your <strong>total debt limit</strong> sets the budget: ${formatPercent(input.backEndRatio, 1)} of income is
  ${formatCurrency(view.grossMonthlyIncome * input.backEndRatio / 100)} a month, and your ${formatCurrency(input.monthlyDebt)} of other debt payments leave
  <strong>${formatCurrency(view.backEndCap)}</strong> for housing.${view.withoutDebt ? html` Without those payments the housing limit would apply and
  the price could rise by about <strong>${formatCurrencyWhole(gain)}</strong>, to ${formatCurrencyWhole(view.withoutDebt.maxHomePrice)}.` : ''}</p>`;
}

function breakdown(view) {
  const parts = [
    ['Principal and interest', view.principalAndInterest],
    ['Property tax', view.propertyTax],
    ['Homeowners insurance', view.insurance],
    ['PMI', view.pmi],
    ['HOA dues', view.hoa]
  ].filter(([, amount]) => amount > 0);
  return dataTable({
    id: 'afford-breakdown',
    title: 'The monthly payment at that price',
    columns: [{ key: 'item', label: 'Part' }, { key: 'amount', label: 'Per month', numeric: true }],
    rows: [
      ...parts.map(([item, amount]) => ({ item, amount: formatCurrency(amount) })),
      { item: 'Total', amount: formatCurrency(view.monthlyHousingCost), selected: true }
    ]
  });
}

function rates(view) {
  return dataTable({
    id: 'afford-rates',
    title: 'The same budget at other rates',
    columns: [
      { key: 'rate', label: 'Rate' },
      { key: 'price', label: 'Home price', numeric: true },
      { key: 'pi', label: 'Principal and interest', numeric: true }
    ],
    rows: view.rateScenarios.map((row) => ({
      rate: `${formatPercent(row.annualRate, 3)}${row.current ? ' (yours)' : ''}`,
      price: formatCurrencyWhole(row.maxHomePrice),
      pi: formatCurrency(row.principalAndInterest),
      selected: row.current
    }))
  });
}

export function affordabilityResults(view) {
  if (!view.affordable) {
    return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your affordability estimate</h2>
  <p class="callout callout--warning"><strong>These limits leave no room for a mortgage payment.</strong> After your other debt payments, insurance and HOA
  dues, the budget allowed by your limits is ${formatCurrency(view.housingPaymentCap)} a month. Lower debts, higher income or different limits would change this.</p>
</section>`;
  }
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your affordability estimate</h2>
  ${summary(view)}
  ${limitBlock(view)}
  ${view.pmi > 0 ? html`<p class="note">With less than 20% down, the payment includes ${formatCurrency(view.pmi)} a month of PMI at your rate.</p>` : ''}
  ${breakdown(view)}
</section>
<section class="result-block" aria-labelledby="rates-heading">
  <h2 id="rates-heading">How the rate changes the price</h2>
  ${rates(view)}
  <p class="note">Same income, debts, down payment and limits; only the rate changes. Closing costs are not included: keep cash for them on top of the down payment.</p>
</section>`;
}

export function affordabilityQuickResult(view) {
  if (!view.affordable) return html`<strong>No room for a mortgage payment</strong> within these limits. <a href="#summary-heading">See why</a>`;
  return html`About <strong>${formatCurrencyWhole(view.maxHomePrice)}</strong> · ${formatCurrency(view.monthlyHousingCost)}/month for housing.
  <a href="#summary-heading">See full results</a>`;
}

export function affordabilityAnnouncement(view) {
  if (!view.affordable) return 'These limits leave no room for a mortgage payment.';
  return `Home price about ${formatCurrencyWhole(view.maxHomePrice)}, with a monthly housing payment of ${formatCurrency(view.monthlyHousingCost)}.`;
}
