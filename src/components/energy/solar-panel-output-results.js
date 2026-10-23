/**
 * Results panel for the Solar Panel Output Calculator. Pure function of the
 * view model from src/adapters/energy/solar-panel-output.js.
 */

import { html } from '../../lib/html.js';
import { statGrid } from '../results.js';
import { plainDecimal } from '../../lib/energy/format.js';

export function outputResults({ input, dailyText, annualText, monthlyText, notes }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Solar output</h2>
  ${statGrid([
    { label: 'Per day', value: dailyText, primary: true,
      note: `${plainDecimal(input.sizeKw)} kW × ${plainDecimal(input.sunHours)} h × (1 − ${plainDecimal(input.losses)}%)` },
    { label: 'Per year', value: annualText, note: 'Per day × 365' },
    { label: 'Per month (average)', value: monthlyText, note: 'Per year ÷ 12' }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  <p class="note">Output varies with the season and the weather; the monthly figure is an average, not a forecast.</p>
</section>`;
}

export function outputQuickResult({ dailyText, annualText }) {
  return html`<strong>${dailyText}</strong> a day, ${annualText} a year. <a href="#summary-heading">See full results</a>`;
}

export function outputAnnouncement({ dailyText, annualText }) {
  return `${dailyText} a day, ${annualText} a year.`;
}
