/**
 * Results panel for the Dividend Calculator. Pure function of the view model
 * from src/adapters/dividend.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole } from '../lib/format.js';
import { statGrid, dataTable, breakdownBar } from './results.js';

export function dividendResults(view) {
  const { input } = view;
  const growth = view.endingValue - view.contributed - (input.reinvest ? view.reinvested : view.cash);
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your dividend projection</h2>
  ${statGrid([
    { label: 'Annual dividend income', value: formatCurrencyWhole(view.nextYearIncome), primary: true, note: `Before tax, going into year ${input.years + 1}; about ${formatCurrencyWhole(view.monthlyIncomeNextYear)} a month` },
    { label: 'Ending value', value: formatCurrencyWhole(view.endingValue), note: input.reinvest ? `After ${input.years} years, dividends reinvested` : `After ${input.years} years, including ${formatCurrencyWhole(view.cash)} of dividends taken as cash` },
    { label: 'Total dividends', value: formatCurrencyWhole(view.totalDividends), note: view.totalTaxes > 0 ? `${formatCurrencyWhole(view.totalTaxes)} of it paid in tax` : 'Before any tax' },
    { label: 'Yield on cost', value: `${view.yieldOnCost.toFixed(2)}%`, note: `Next year's income ÷ the ${formatCurrencyWhole(view.contributed)} you put in` },
    ...(view.reinvestGain !== null ? [{ label: 'Gain from reinvesting', value: formatCurrencyWhole(view.reinvestGain), note: 'Compared with taking dividends as cash' }] : []),
    ...(view.neededForTarget !== null ? [{ label: `For ${formatCurrencyWhole(input.targetIncome)} a year`, value: formatCurrencyWhole(view.neededForTarget), note: `Invested today at a ${input.dividendYield}% yield, before tax` }] : [])
  ])}
  ${breakdownBar({
    label: 'Where the ending value comes from',
    parts: [
      { label: 'Money you put in', amount: view.contributed, display: formatCurrencyWhole(view.contributed) },
      { label: input.reinvest ? 'Reinvested dividends' : 'Dividends taken as cash', amount: input.reinvest ? view.reinvested : view.cash, display: formatCurrencyWhole(input.reinvest ? view.reinvested : view.cash) },
      { label: 'Price growth', amount: Math.max(0, growth), display: formatCurrencyWhole(growth) }
    ]
  })}
  ${dataTable({
    id: 'div-schedule',
    title: 'Year by year',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'dividends', label: 'Dividends', numeric: true },
      { key: 'value', label: 'Value at year end', numeric: true },
      { key: 'income', label: 'Annual income rate', numeric: true }
    ],
    rows: view.schedule.map((row) => ({
      year: String(row.year),
      dividends: formatCurrency(row.dividends),
      value: formatCurrencyWhole(row.holdingValue + row.cash),
      income: formatCurrencyWhole(row.annualIncome)
    }))
  })}
  <p class="note">An illustration with constant rates, not a forecast. Real dividends and prices change, dividends can be cut, and past growth does not
  guarantee future results.</p>
</section>`;
}

export function dividendQuickResult(view) {
  return html`<strong>${formatCurrencyWhole(view.nextYearIncome)} a year</strong> in dividends after ${view.input.years} years. <a href="#summary-heading">See full results</a>`;
}

export function dividendAnnouncement(view) {
  return `After ${view.input.years} years: about ${formatCurrencyWhole(view.nextYearIncome)} a year in dividends and ${formatCurrencyWhole(view.endingValue)} in total.`;
}
