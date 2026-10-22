/**
 * Results panel for the Electric Bill Calculator. Pure function of the view
 * model from src/adapters/energy/electric-bill.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';

export function billResults({ input, result, averageText }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your electric bill</h2>
  ${statGrid([
    { label: 'Estimated bill', value: formatCurrency(result.billCents / 100), primary: true,
      note: `${formatCurrency(result.energyCents / 100)} for energy + ${formatCurrency(result.fixed)} fixed` },
    { label: 'Daily cost including fixed charges', value: formatCurrency(result.dailyCents / 100), note: `Over ${formatCount(input.days)} days` },
    { label: 'Average cost per kWh', value: averageText ?? '—', note: averageText ? 'Bill ÷ kWh, including fixed charges' : 'Shown from 1 kWh of use' },
    { label: '12 × this bill', value: formatCurrency(result.twelveTimesBillCents / 100), note: 'Not a forecast: usage changes with the seasons' }
  ])}
  ${result.highRate ? html`<p class="note">Check the rate: it is more than $1 per kWh. Enter dollars, for example 0.16 for 16¢.</p>` : ''}
  <p class="note">Only the charges you enter are included. Tiered or time-of-use rates, riders and taxes are not modeled.</p>
</section>`;
}

export function billQuickResult({ result }) {
  return html`<strong>${formatCurrency(result.billCents / 100)}</strong> estimated bill (${formatCurrency(result.dailyCents / 100)} a day). <a href="#summary-heading">See full results</a>`;
}

export function billAnnouncement({ result }) {
  return `Estimated bill ${formatCurrency(result.billCents / 100)}, ${formatCurrency(result.dailyCents / 100)} a day.`;
}
