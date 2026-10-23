/**
 * Results panel for the EV Cost Per Mile Calculator. Pure function of the
 * view model from src/adapters/energy/ev-cost-per-mile.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';
import { plainDecimal } from '../../lib/energy/format.js';

export function perMileResults({ input, result, perMileText, milesPerKwhText, notes }) {
  const basis = input.figureType === 'epa'
    ? `${plainDecimal(input.figure)} kWh per 100 miles (EPA)`
    : `${plainDecimal(input.figure)} mi/kWh (trip computer) and ${formatCount(input.efficiencyPercent)}% charging efficiency`;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Electricity cost per mile</h2>
  ${statGrid([
    { label: 'Cost per mile', value: perMileText, primary: true, note: `${basis}, with electricity at $${plainDecimal(input.rate)} per kWh` },
    { label: 'Cost per 100 miles', value: formatCurrency(result.costPer100MilesCents / 100), note: 'From the rounded cost per mile' },
    ...(milesPerKwhText !== null ? [{ label: 'Miles per kWh', value: milesPerKwhText, note: '100 ÷ the EPA kWh per 100 miles' }] : []),
    ...(result.annualCents !== null ? [{ label: 'Per year', value: formatCurrency(result.annualCents / 100), note: `${formatCount(input.annualMiles)} miles` }] : [])
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  ${input.figureType === 'epa'
    ? html`<p class="note">The EPA figure already includes charging losses, so no charging efficiency is applied.</p>`
    : html`<p class="note">The trip-computer figure is used as your vehicle reports it, and your charging efficiency is applied once, as entered.</p>`}
</section>`;
}

export function perMileQuickResult({ result, perMileText }) {
  return html`<strong>${perMileText}</strong> per mile (${formatCurrency(result.costPer100MilesCents / 100)} per 100 miles). <a href="#summary-heading">See full results</a>`;
}

export function perMileAnnouncement({ result, perMileText }) {
  return `${perMileText} per mile, ${formatCurrency(result.costPer100MilesCents / 100)} per 100 miles.`;
}
