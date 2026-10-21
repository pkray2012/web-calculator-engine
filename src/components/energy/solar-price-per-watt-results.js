/**
 * Results panel for the Solar Price Per Watt Calculator. Pure function of the
 * view model from src/adapters/energy/solar-price-per-watt.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency, formatCount } from '../../lib/format.js';
import { statGrid } from '../results.js';
import { plainDecimal } from '../../lib/energy/format.js';

const watts = (value) => `${formatCount(value)} W`;

export function ppwResults({ input, result, gross, net, hasIncentives }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Price per watt</h2>
  ${statGrid([
    { label: hasIncentives ? 'Net price per watt' : 'Price per watt', value: hasIncentives ? net : gross, primary: true,
      note: `${formatCurrency(result.netPriceCents / 100)} ÷ ${watts(result.watts)}` },
    ...(hasIncentives ? [{ label: 'Gross price per watt', value: gross, note: `${formatCurrency(input.priceCents / 100)} before incentives` }] : []),
    { label: 'System size', value: watts(result.watts), note: input.unit === 'kW' ? `${plainDecimal(input.size)} kW × 1,000` : null }
  ])}
  <p class="note">Compare quotes on the same basis: the DC rating, and the same equipment (with or without a battery).</p>
</section>`;
}

export function ppwQuickResult({ gross, net, hasIncentives }) {
  return html`<strong>${hasIncentives ? net : gross}</strong>${hasIncentives ? ` after incentives (${gross} before)` : ''}. <a href="#summary-heading">See full results</a>`;
}

export function ppwAnnouncement({ gross, net, hasIncentives }) {
  return hasIncentives ? `Net price ${net}, gross ${gross}.` : `Price ${gross}.`;
}
