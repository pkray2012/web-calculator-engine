/**
 * Results panel for the Electricity Cost Calculator. Pure function of the
 * view model from src/adapters/energy/electricity-cost.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';
import { plainDecimal } from '../../lib/energy/format.js';

export function electricityCostResults({ input, result, kwhText, kwhPerDayText, notes }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Cost to run</h2>
  ${statGrid([
    { label: 'Cost', value: formatCurrency(result.costCents / 100), primary: true, note: `${kwhText} at $${plainDecimal(input.rate)} per kWh` },
    { label: 'Energy used', value: kwhText, note: `Over ${formatCount(input.days)} ${input.days === 1 ? 'day' : 'days'}` },
    { label: 'Cost per day', value: formatCurrency(result.costPerDayCents / 100), note: `${kwhPerDayText} a day` }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
</section>`;
}

export function electricityCostQuickResult({ result, kwhText }) {
  return html`<strong>${formatCurrency(result.costCents / 100)}</strong> for ${kwhText}. <a href="#summary-heading">See full results</a>`;
}

export function electricityCostAnnouncement({ result, kwhText }) {
  return `Cost ${formatCurrency(result.costCents / 100)} for ${kwhText}.`;
}
