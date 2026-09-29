/**
 * Results panel for the Mortgage Payment Calculator. Pure function of the
 * view model from src/adapters/mortgage-payment.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration, formatMonth, formatPercent, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const when = (months, date) => (date ? `${formatMonth(date)} (after ${formatCount(months)} payments)` : `after ${formatCount(months)} payments (${formatDuration(months)})`);

function summary(view) {
  const pmiStat = view.pmi.required && view.pmi.monthly === 0
    ? { label: 'PMI', value: 'Not included', note: 'Enter your PMI rate' }
    : view.pmi.required
    ? { label: 'PMI', value: `${formatCurrency(view.pmi.monthly)}/month`, note: view.pmi.autoEndMonth ? `Ends automatically ${view.pmi.autoEndDate ? formatMonth(view.pmi.autoEndDate) : `after ${formatDuration(view.pmi.autoEndMonth)}`}` : 'Check your PMI terms' }
    : { label: 'PMI', value: 'None', note: `${formatPercent(view.downPaymentPercent, 1)} down (20% or more)` };
  return statGrid([
    { label: 'Monthly payment', value: formatCurrency(view.totalMonthly), primary: true, note: 'Principal, interest, taxes, insurance, PMI and HOA' },
    { label: 'Principal and interest', value: formatCurrency(view.monthly.principalAndInterest), note: `${formatCount(view.payments)} payments at ${formatPercent(view.input.annualRate, 3)}` },
    { label: 'Loan amount', value: formatCurrency(view.loanAmount), note: `${formatPercent(view.ltv, 1)} of the price (loan-to-value)` },
    pmiStat,
    { label: 'Total interest', value: formatCurrency(view.totalInterest), note: `Over ${formatDuration(view.payments)}` }
  ]);
}

function breakdown(view) {
  const parts = [
    ['Principal and interest', view.monthly.principalAndInterest],
    ['Property tax', view.monthly.propertyTax],
    ['Homeowners insurance', view.monthly.insurance],
    ['PMI', view.monthly.pmi],
    ['HOA dues', view.monthly.hoa]
  ].filter(([, amount]) => amount > 0);
  return dataTable({
    id: 'payment-breakdown',
    title: 'Where the monthly payment goes',
    columns: [{ key: 'item', label: 'Part' }, { key: 'amount', label: 'Per month', numeric: true }, { key: 'share', label: 'Share', numeric: true }],
    rows: [
      ...parts.map(([item, amount]) => ({ item, amount: formatCurrency(amount), share: formatPercent(amount / view.totalMonthly * 100, 1) })),
      { item: 'Total', amount: formatCurrency(view.totalMonthly), share: '100%', selected: true }
    ]
  });
}

function pmiBlock(view) {
  const { pmi } = view;
  if (!pmi.required) return '';
  if (pmi.rateMissing || pmi.monthly === 0) {
    return html`<p class="callout callout--warning"><strong>With less than 20% down, a conventional loan may require PMI.</strong> Enter the PMI rate from
    your lender to include it; the payment above leaves it out.</p>`;
  }
  return html`<p class="callout">PMI adds <strong>${formatCurrency(pmi.monthly)}</strong> a month. You can ask your lender to cancel it once the balance
  is scheduled to reach 80% of the home's original value: <strong>${when(pmi.canRequestMonth, pmi.canRequestDate)}</strong>. It ends automatically at 78%:
  <strong>${when(pmi.autoEndMonth, pmi.autoEndDate)}</strong>, after about ${formatCurrency(pmi.total)} of PMI. Then the payment drops to
  ${formatCurrency(view.totalMonthlyAfterPmi)}. Paying extra principal can reach these points sooner.</p>`;
}

function lifetime(view) {
  const housing = (view.monthly.propertyTax + view.monthly.insurance + view.monthly.hoa) * view.payments;
  return dataTable({
    id: 'mortgage-lifetime',
    title: 'Total cost over the loan, if taxes, insurance and dues stay the same',
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { item: 'Down payment', amount: formatCurrency(view.downPayment) },
      { item: 'Principal repaid', amount: formatCurrency(view.loanAmount) },
      { item: 'Interest', amount: formatCurrency(view.totalInterest) },
      { item: 'PMI', amount: formatCurrency(view.pmi.total) },
      { item: 'Taxes, insurance and HOA dues', amount: formatCurrency(housing) },
      { item: 'Total', amount: formatCurrency(view.lifetimeCost), selected: true }
    ]
  });
}

function schedule(view) {
  const table = dataTable({
    id: 'mortgage-schedule',
    title: 'Principal and interest, year by year',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'principal', label: 'Principal', numeric: true },
      { key: 'interest', label: 'Interest', numeric: true },
      { key: 'balance', label: 'Balance at year end', numeric: true }
    ],
    rows: view.yearly.map((row) => ({
      year: String(row.year),
      principal: formatCurrency(row.principal),
      interest: formatCurrency(row.interest),
      balance: formatCurrency(row.balance)
    }))
  });
  return html`<details class="disclosure">
  <summary>Show all ${formatCount(view.yearly.length)} years</summary>
  ${table}
</details>`;
}

export function mortgagePaymentResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your mortgage estimate</h2>
  ${summary(view)}
  ${pmiBlock(view)}
  ${breakdown(view)}
  <p class="note">Taxes, insurance and dues are your estimates and usually change over time. Lenders often collect them monthly in an escrow account.</p>
</section>
<section class="result-block" aria-labelledby="lifetime-heading">
  <h2 id="lifetime-heading">Over the life of the loan</h2>
  ${lifetime(view)}
  ${schedule(view)}
</section>`;
}

export function mortgageQuickResult(view) {
  return html`<strong>${formatCurrency(view.totalMonthly)}</strong>/month in total · ${formatCurrency(view.monthly.principalAndInterest)} principal and interest.
  <a href="#summary-heading">See full results</a>`;
}

export function mortgageAnnouncement(view) {
  const pmi = view.pmi.required && view.pmi.monthly > 0 ? ` PMI ${formatCurrency(view.pmi.monthly)} a month until about payment ${view.pmi.autoEndMonth}.` : '';
  return `Monthly payment ${formatCurrency(view.totalMonthly)}, including ${formatCurrency(view.monthly.principalAndInterest)} principal and interest.${pmi}`;
}
