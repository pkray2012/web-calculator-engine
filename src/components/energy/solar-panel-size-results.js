/**
 * Results panel for the Solar Panel Size Calculator. Pure function of the
 * view model from src/adapters/energy/solar-panel-size.js.
 */

import { html } from '../../lib/html.js';
import { statGrid } from '../results.js';
import { plainDecimal } from '../../lib/energy/format.js';

/** A number as entered, grouped with commas: 10800 → "10,800", 10800.5 → "10,800.5". */
const grouped = (x) => plainDecimal(x).replace(/^\d+/, (whole) => whole.replace(/\B(?=(\d{3})+(?!\d))/g, ','));

export function sizeResults({ input, sizeText, panelsText, notes }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Solar system size</h2>
  ${statGrid([
    { label: 'System size (DC)', value: sizeText, primary: true,
      note: `${grouped(input.annualKwh)} kWh ÷ (${plainDecimal(input.sunHours)} h × 365 × (1 − ${plainDecimal(input.losses)}%))` },
    panelsText === null
      ? { label: 'Panels', value: 'No panel rating entered', note: 'Enter one panel\'s watts to count the panels' }
      : { label: 'Panels', value: panelsText, note: `Of ${plainDecimal(input.panelWatts)} W, rounded up to cover the size` }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  <p class="note">An estimate, not a system design: roof space, shading and inverter limits are not checked.</p>
</section>`;
}

export function sizeQuickResult({ sizeText, panelsText }) {
  return html`System size: <strong>${sizeText}</strong>${panelsText === null ? '' : html`, ${panelsText} panels`}. <a href="#summary-heading">See full results</a>`;
}

export function sizeAnnouncement({ sizeText, panelsText }) {
  return `System size ${sizeText}${panelsText === null ? '' : `, ${panelsText} panels`}.`;
}
