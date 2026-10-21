/**
 * Results panel for the two charging-time pages. Pure function of the view
 * model from src/adapters/energy/charging-time.js.
 */

import { html } from '../../lib/html.js';
import { formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';

const kw = (value) => `${formatCount(value)} kW`;
const percent = (value) => `${formatCount(value)}%`;

export function chargeResults({ input, result, energyText, timeText, sourceText, message, notes }) {
  const wall = input.basis === 'wall';
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Charging time</h2>
  ${statGrid([
    { label: 'Time to charge', value: timeText, primary: true,
      note: wall ? `${energyText} at ${kw(result.effectivePowerKw)} × ${percent(input.efficiencyPercent)} efficiency` : `${energyText} at ${kw(result.effectivePowerKw)} into the battery` },
    { label: 'Energy added to the battery', value: energyText, note: `${percent(input.startPercent)} to ${percent(input.targetPercent)} of ${formatCount(input.capacityKwh)} kWh` },
    ...(sourceText ? [{ label: 'Energy drawn from the source', value: sourceText, note: 'Including charging losses' }] : [])
  ])}
  ${message ? html`<p class="note">${message}</p>` : ''}
  ${result.vehicleCapApplied ? html`<p class="note">Limited to the vehicle's maximum AC rate of ${kw(result.effectivePowerKw)}.</p>` : ''}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  <p class="note">An estimate at constant power. Real charging can take longer: power often drops as the battery fills, and temperature and other loads matter.</p>
</section>`;
}

export function chargeQuickResult({ timeText, energyText }) {
  return html`<strong>${timeText}</strong> to add ${energyText}. <a href="#summary-heading">See full results</a>`;
}

export function chargeAnnouncement({ timeText, energyText }) {
  return `${timeText} to add ${energyText}.`;
}
