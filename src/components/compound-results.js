/**
 * Results panel for the Compound Interest Calculator. Pure function of the
 * view model from src/adapters/compound-interest.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const years = (value) => `${value.toFixed(1)} years`;

export function compoundResults(view) {
  const { input } = view;
  const inflation = input.inflationPercent > 0;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your balance after ${input.years} ${input.years === 1 ? 'year' : 'years'}</h2>
  ${statGrid([
    { label: 'Future value', value: formatCurrency(view.futureValue), primary: true, note: inflation ? `${formatCurrencyWhole(view.realValue)} in today's dollars at ${formatPercent(input.inflationPercent)} inflation` : `APY ${formatPercent(view.apy * 100, 3)}` },
    { label: 'Total interest', value: formatCurrency(view.totalInterest), note: `On ${formatCurrencyWhole(view.totalContributed)} of deposits` },
    { label: 'Extra from compounding', value: formatCurrency(view.compoundingBonus), note: `Simple interest would give ${formatCurrencyWhole(view.simpleInterestValue)}` }
  ])}
  ${view.doublingYears !== null ? html`<p class="note">A lump sum doubles in ${years(view.doublingYears)} at this rate; the rule of 72 estimates ${years(view.ruleOf72Years)}.</p>` : ''}
  ${dataTable({
    id: 'ci-schedule',
    title: 'Growth by year',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'contributions', label: 'Deposits', numeric: true },
      { key: 'interest', label: 'Interest', numeric: true },
      { key: 'total', label: 'Total deposited', numeric: true },
      { key: 'balance', label: 'Balance', numeric: true }
    ],
    rows: view.schedule.map((row) => ({
      year: String(row.year),
      contributions: formatCurrencyWhole(row.contributions),
      interest: formatCurrencyWhole(row.interest),
      total: formatCurrencyWhole(row.totalContributed),
      balance: formatCurrencyWhole(row.balance),
      selected: row.year === input.years
    }))
  })}
</section>`;
}

export function compoundQuickResult(view) {
  return html`<strong>${formatCurrency(view.futureValue)}</strong> after ${view.input.years} years, including ${formatCurrency(view.totalInterest)} of interest. <a href="#summary-heading">See full results</a>`;
}

export function compoundAnnouncement(view) {
  return `Your balance grows to ${formatCurrency(view.futureValue)} after ${view.input.years} years, with ${formatCurrency(view.totalInterest)} of interest.`;
}
