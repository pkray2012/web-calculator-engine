/**
 * Results panel for the EV Gas Savings Calculator. Pure function of the view
 * model from src/adapters/energy/ev-gas-savings.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';

const money = (cents) => formatCurrency(cents / 100);

export function savingsResults({ input, result, evPerMileText, gasPerMileText, notes }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Fuel cost for ${formatCount(input.miles)} miles</h2>
  ${statGrid([
    { label: 'Fuel savings per year', value: money(result.savingsCents), primary: true, note: `${money(result.savingsPerMonthCents)} a month` },
    { label: 'Electricity for the EV', value: money(result.evCents), note: `${evPerMileText} per mile` },
    { label: 'Gas for the gas car', value: money(result.gasCents), note: `${gasPerMileText} per mile` }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  <p class="note">Fuel only: purchase price, maintenance, insurance and incentives are not included.</p>
</section>`;
}

/** A negative saving is worded as the extra cost of the EV, so no "-$" amount is called savings. */
export function savingsQuickResult({ result }) {
  const versus = `${money(result.evCents)} for electricity vs ${money(result.gasCents)} for gas`;
  return result.savingsCents < 0
    ? html`<strong>${money(-result.savingsCents)}</strong> more a year to fuel the EV (${versus}). <a href="#summary-heading">See full results</a>`
    : html`<strong>${money(result.savingsCents)}</strong> fuel savings a year (${versus}). <a href="#summary-heading">See full results</a>`;
}

export function savingsAnnouncement({ result }) {
  const sides = `electricity ${money(result.evCents)}, gas ${money(result.gasCents)}`;
  return result.savingsCents < 0 ? `The EV costs ${money(-result.savingsCents)} more a year to fuel: ${sides}.` : `Fuel savings ${money(result.savingsCents)} a year: ${sides}.`;
}
