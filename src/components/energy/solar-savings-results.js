/**
 * Results panel for the Solar Savings Calculator. Pure function of the view
 * model from src/adapters/energy/solar-savings.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { statGrid } from '../results.js';
import { plainDecimal } from '../../lib/energy/format.js';

export function solarSavingsResults({ input, savingsText, perMonthText, selfKwhText, exportedKwhText, perKwhText, notes }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Bill savings from solar</h2>
  ${statGrid([
    { label: 'Savings per year', value: savingsText, primary: true, note: `${perMonthText} a month` },
    { label: 'Used at home', value: selfKwhText, note: `At $${plainDecimal(input.retailRate)} per kWh` },
    { label: 'Sent to the grid', value: exportedKwhText, note: `At $${plainDecimal(input.exportRate)} per kWh` },
    { label: 'Value per solar kWh', value: perKwhText, note: input.feesCents > 0 ? `After ${formatCurrency(input.feesCents / 100)} of yearly fees` : 'No solar fees entered' }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
</section>`;
}

export function solarSavingsQuickResult({ savingsText }) {
  return html`Savings: <strong>${savingsText}</strong> a year. <a href="#summary-heading">See full results</a>`;
}

export function solarSavingsAnnouncement({ savingsText, perMonthText }) {
  return `Savings ${savingsText} a year, ${perMonthText} a month.`;
}
