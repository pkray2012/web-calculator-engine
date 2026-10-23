/**
 * Results panel for the Solar ROI Calculator. Pure function of the view model
 * from src/adapters/energy/solar-roi.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';

export const ROI_DEFINITION = 'Simple ROI: no time value of money, no change in electricity prices and no loss of panel output. It is not an internal rate of return (IRR), a net present value or an annualized return.';

export function roiResults({ input, result, roiText, netCostText, totalText, gainText, notes }) {
  const years = `${formatCount(input.years)} ${input.years === 1 ? 'year' : 'years'}`;
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Simple return on investment</h2>
  ${statGrid([
    { label: `ROI over ${years}`, value: roiText, primary: true, note: result.defined ? `Net gain ${gainText} ÷ net cost ${netCostText}` : null },
    { label: 'Net cost', value: netCostText, note: input.incentivesCents > 0 ? `After ${formatCurrency(input.incentivesCents / 100)} of incentives` : 'No incentives entered' },
    { label: 'Total net savings', value: totalText, note: `${formatCurrency(result.netSavingsPerYearCents / 100)} a year × ${years}` },
    { label: 'Net gain', value: gainText, note: 'Total net savings minus the net cost' }
  ])}
  ${notes.map((note) => html`<p class="note">${note}</p>`)}
  <p class="note">${ROI_DEFINITION}</p>
</section>`;
}

export function roiQuickResult({ input, roiText }) {
  return html`ROI over ${formatCount(input.years)} ${input.years === 1 ? 'year' : 'years'}: <strong>${roiText}</strong>. <a href="#summary-heading">See full results</a>`;
}

export function roiAnnouncement({ input, roiText }) {
  return `ROI over ${input.years} ${input.years === 1 ? 'year' : 'years'}: ${roiText}.`;
}
