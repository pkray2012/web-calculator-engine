/**
 * Results panel for the Rent vs. Buy Calculator. Pure function of the view
 * model from src/adapters/rent-vs-buy.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatCount } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

const yearsText = (years) => `${formatCount(years)} year${years === 1 ? '' : 's'}`;

function verdict(view) {
  const years = view.input.years;
  return view.buyingWins
    ? { label: `After ${yearsText(years)}`, value: 'Buying comes out ahead', primary: true, note: `By about ${formatCurrencyWhole(view.advantage)} in net worth` }
    : { label: `After ${yearsText(years)}`, value: 'Renting comes out ahead', primary: true, note: `By about ${formatCurrencyWhole(-view.advantage)} in net worth` };
}

function summary(view) {
  return statGrid([
    verdict(view),
    { label: 'Break-even', value: view.breakevenYear ? `Year ${view.breakevenYear}` : 'Not within this time', note: 'First year buying is ahead, if you sold then' },
    { label: 'First month: owning', value: formatCurrency(view.firstMonth.buyCost), note: 'Mortgage, PMI, tax, insurance, maintenance and HOA' },
    { label: 'First month: renting', value: formatCurrency(view.firstMonth.rentCost), note: 'Rent and renters insurance' }
  ]);
}

function netWorthTable(view) {
  return dataTable({
    id: 'rvb-years',
    title: 'Net worth if you sold at the end of each year',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'buy', label: 'Buying', numeric: true },
      { key: 'rent', label: 'Renting', numeric: true },
      { key: 'gap', label: 'Buying minus renting', numeric: true }
    ],
    rows: view.rows.map((row) => ({
      year: String(row.year),
      buy: formatCurrencyWhole(row.buyerNetWorth),
      rent: formatCurrencyWhole(row.renterNetWorth),
      gap: formatCurrencyWhole(row.buyerNetWorth - row.renterNetWorth),
      selected: row.year === view.breakevenYear
    }))
  });
}

function breakdown(view) {
  const { last } = view;
  return dataTable({
    id: 'rvb-breakdown',
    title: `Where each path stands after ${yearsText(view.input.years)}`,
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { item: 'Home value', amount: formatCurrencyWhole(last.homeValue) },
      { item: 'Loan balance', amount: `− ${formatCurrencyWhole(last.loanBalance)}` },
      { item: 'Selling costs', amount: `− ${formatCurrencyWhole(last.homeValue - last.loanBalance - last.homeEquityAfterSale)}` },
      { item: 'Buyer’s other investments', amount: `+ ${formatCurrencyWhole(last.buyerInvestments)}` },
      { item: 'Buyer’s net worth', amount: formatCurrencyWhole(last.buyerNetWorth), selected: true },
      { item: 'Renter’s investments (net worth)', amount: formatCurrencyWhole(last.renterNetWorth), selected: true },
      { item: 'Spent on owning (incl. down payment and closing)', amount: formatCurrencyWhole(last.buyerCosts) },
      { item: 'Spent on renting', amount: formatCurrencyWhole(last.renterCosts) }
    ]
  });
}

export function rentVsBuyResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your rent vs. buy estimate</h2>
  ${summary(view)}
  <p class="note">Both paths spend the same cash: the up-front cash of buying is invested by the renter, and each month whichever path costs less
  invests the difference. Results depend heavily on your growth and return assumptions; try a few.</p>
</section>
<section class="result-block" aria-labelledby="years-heading">
  <h2 id="years-heading">Year by year</h2>
  ${netWorthTable(view)}
</section>
<section class="result-block" aria-labelledby="breakdown-heading">
  <h2 id="breakdown-heading">What makes up the difference</h2>
  ${breakdown(view)}
</section>`;
}

export function rentVsBuyQuickResult(view) {
  const lead = view.buyingWins ? 'Buying' : 'Renting';
  const breakeven = view.breakevenYear ? ` Break-even in year ${view.breakevenYear}.` : '';
  return html`<strong>${lead}</strong> comes out ahead after ${yearsText(view.input.years)}.${breakeven} <a href="#summary-heading">See full results</a>`;
}

export function rentVsBuyAnnouncement(view) {
  const lead = view.buyingWins ? 'Buying' : 'Renting';
  const gap = formatCurrencyWhole(Math.abs(view.advantage));
  const breakeven = view.breakevenYear ? ` Buying breaks even in year ${view.breakevenYear}.` : ' Buying does not break even within this time.';
  return `${lead} comes out ahead after ${yearsText(view.input.years)} by about ${gap}.${breakeven}`;
}
