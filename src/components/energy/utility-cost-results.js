/**
 * Results panel for the Utility Cost Calculator. Pure function of the view
 * model from src/adapters/energy/utility-cost.js.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { statGrid, dataTable } from '../results.js';

export function utilityResults({ result, shares, sharesNote, message }) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your monthly utilities</h2>
  ${statGrid([
    { label: 'Monthly total', value: formatCurrency(result.monthly), primary: true, note: 'The sum of the bills you entered' },
    { label: '12 × this month', value: formatCurrency(result.twelveTimesMonthly), note: 'Not a forecast: bills vary by month' }
  ])}
  ${message ? html`<p class="note">${message}</p>` : ''}
  ${shares ? dataTable({
    id: 'utility-shares',
    title: 'Each bill\'s share of the total',
    columns: [{ key: 'label', label: 'Bill' }, { key: 'amount', label: 'Amount', numeric: true }, { key: 'share', label: 'Share', numeric: true }],
    rows: shares.map((row) => ({ label: row.label, amount: formatCurrency(row.amount), share: row.shareText }))
  }) : ''}
  ${sharesNote ? html`<p class="note">${sharesNote}</p>` : ''}
</section>`;
}

export function utilityQuickResult({ result }) {
  return html`<strong>${formatCurrency(result.monthly)}</strong> a month in utilities. <a href="#summary-heading">See full results</a>`;
}

export function utilityAnnouncement({ result }) {
  return `Monthly utilities ${formatCurrency(result.monthly)}.`;
}
