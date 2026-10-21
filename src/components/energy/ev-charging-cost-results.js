/**
 * Results panel for the EV Charging Cost Calculator. Pure function of the view
 * model from src/adapters/energy/ev-charging-cost.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';
import { plainDecimal } from '../../lib/energy/format.js';

export function evCostResults({ input, result, batteryText, meteredText, perMileText, message, notes }) {
  const perMile = result.perMile;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Charging cost</h2>
  ${statGrid([
    { label: 'Cost per charge', value: formatCurrency(result.costPerCharge), primary: true, note: `${meteredText} at $${plainDecimal(input.rate)} per kWh` },
    { label: 'Energy drawn from the wall', value: meteredText, note: `${batteryText} into the battery at ${formatCount(input.efficiencyPercent)}% efficiency` },
    ...(perMile ? [
      { label: 'Cost per mile', value: perMileText, note: `${formatCurrency(perMile.costPer100Miles)} per 100 miles` },
      ...(perMile.monthly !== null ? [{ label: 'Per month', value: formatCurrency(perMile.monthly), note: `${formatCount(input.milesPerMonth)} miles` }] : [])
    ] : [])
  ])}
  ${message ? html`<p class="note">${message}</p>` : ''}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  ${input.figureType === 'epa' ? html`<p class="note">The EPA figure already includes charging losses, so the charging efficiency is not applied to the cost per mile.</p>` : ''}
</section>`;
}

export function evCostQuickResult({ result, perMileText }) {
  return html`<strong>${formatCurrency(result.costPerCharge)}</strong> per charge${perMileText ? `, ${perMileText} per mile` : ''}. <a href="#summary-heading">See full results</a>`;
}

export function evCostAnnouncement({ result, perMileText }) {
  return `${formatCurrency(result.costPerCharge)} per charge${perMileText ? `, ${perMileText} per mile` : ''}.`;
}
