/**
 * Results panel for the EV Gas Savings Calculator. Pure function of the view
 * model from src/adapters/energy/ev-gas-savings.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';

export function savingsResults({ input, result, evPerMileText, gasPerMileText, notes }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Fuel cost for ${formatCount(input.miles)} miles</h2>
  ${statGrid([
    { label: 'Fuel savings per year', value: formatCurrency(result.savings), primary: true, note: `${formatCurrency(result.savingsPerMonth)} a month` },
    { label: 'Electricity for the EV', value: formatCurrency(result.evCost), note: `${evPerMileText} per mile` },
    { label: 'Gas for the gas car', value: formatCurrency(result.gasCost), note: `${gasPerMileText} per mile` }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  <p class="note">Fuel only: purchase price, maintenance, insurance and incentives are not included.</p>
</section>`;
}

export function savingsQuickResult({ result }) {
  return html`<strong>${formatCurrency(result.savings)}</strong> fuel savings a year (${formatCurrency(result.evCost)} vs ${formatCurrency(result.gasCost)}). <a href="#summary-heading">See full results</a>`;
}

export function savingsAnnouncement({ result }) {
  return `Fuel savings ${formatCurrency(result.savings)} a year: electricity ${formatCurrency(result.evCost)}, gas ${formatCurrency(result.gasCost)}.`;
}
