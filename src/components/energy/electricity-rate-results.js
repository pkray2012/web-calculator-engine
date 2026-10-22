/**
 * Results panel for the Electricity Rate Calculator. Pure function of the
 * view model from src/adapters/energy/electricity-rate.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';
import { RESIDUAL_LABEL } from '../../adapters/energy/electricity-rate.js';

export function rateResults({ input, result, averageText, residualText, notes }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your cost per kWh</h2>
  ${statGrid([
    { label: 'Average cost per kWh', value: averageText, primary: true, note: `${formatCurrency(result.bill)} ÷ ${formatCount(input.kwh)} kWh, all charges included` },
    { label: RESIDUAL_LABEL, value: residualText, note: `${formatCurrency((input.billCents - input.excludedCents) / 100)} after excluding ${formatCurrency(result.excluded)}` }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  <p class="note">Neither figure is the price of one more kWh, so use the rate on your plan, not these averages, for EV or solar savings.</p>
</section>`;
}

export function rateQuickResult({ averageText, residualText }) {
  return html`<strong>${averageText}</strong> per kWh on average; ${residualText} after the charges you exclude. <a href="#summary-heading">See full results</a>`;
}

export function rateAnnouncement({ averageText, residualText }) {
  return `Average ${averageText} per kWh; ${RESIDUAL_LABEL.toLowerCase()} ${residualText}.`;
}
