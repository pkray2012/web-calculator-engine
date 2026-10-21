/**
 * Results panel for the Solar Payback Period Calculator. Pure function of the
 * view model from src/adapters/energy/solar-payback.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { statGrid } from '../results.js';

export function paybackResults({ input, result, display, note, netCost, netSavings }) {
  const maintenance = input.maintenanceCents > 0;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Simple payback period</h2>
  ${statGrid([
    { label: 'Payback period', value: display, primary: true,
      note: result.outcome === 'payback' ? `${formatCurrency(netCost)} ÷ ${formatCurrency(netSavings)} a year` : null },
    { label: 'Net cost', value: formatCurrency(netCost), note: input.incentivesCents > 0 ? `After ${formatCurrency(input.incentivesCents / 100)} of incentives` : 'No incentives entered' },
    { label: 'Net yearly savings', value: formatCurrency(netSavings), note: maintenance ? `After ${formatCurrency(input.maintenanceCents / 100)} of maintenance` : 'No maintenance entered' }
  ])}
  ${note ? html`<p class="note">${note}</p>` : ''}
  <p class="note">Simple payback ignores the time value of money, changing electricity prices and panel degradation. It is not a return on investment.</p>
</section>`;
}

export function paybackQuickResult({ display }) {
  return html`Simple payback: <strong>${display}</strong>. <a href="#summary-heading">See full results</a>`;
}

export function paybackAnnouncement({ display }) {
  return `Simple payback ${display}.`;
}
