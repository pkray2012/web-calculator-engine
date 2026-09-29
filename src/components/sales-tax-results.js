/**
 * Results panel for the Sales Tax Calculator. Pure function of the view
 * model from src/adapters/sales-tax.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid } from './results.js';

const pct = (value, digits = 3) => `${Number(value.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits })}%`;

export function salesTaxResults({ input, result }) {
  let stats;
  let note;
  if (input.mode === 'add') {
    stats = [
      { label: 'Total with tax', value: formatCurrency(result.total), primary: true, note: `${formatCurrency(result.price)} + ${formatCurrency(result.tax)} tax` },
      { label: 'Sales tax', value: formatCurrency(result.tax), note: `${pct(result.ratePercent)} of ${formatCurrency(result.price)}` }
    ];
    note = `Tax before rounding: $${result.exactTax.toFixed(4)}.`;
  } else if (input.mode === 'remove') {
    stats = [
      { label: 'Price before tax', value: formatCurrency(result.price), primary: true, note: `${formatCurrency(result.total)} ÷ ${(1 + result.ratePercent / 100).toFixed(4)}` },
      { label: 'Sales tax included', value: formatCurrency(result.tax), note: `At ${pct(result.ratePercent)}` }
    ];
    note = 'A receipt can differ by a cent, depending on how the seller rounded the tax.';
  } else {
    stats = [
      { label: 'Sales tax rate', value: pct(result.ratePercent), primary: true, note: `${formatCurrency(result.tax)} tax on ${formatCurrency(result.price)}` },
      { label: 'Sales tax paid', value: formatCurrency(result.tax), note: `${formatCurrency(result.total)} − ${formatCurrency(result.price)}` }
    ];
    note = `Because tax is rounded to the cent, any rate from ${pct(result.rateLowPercent)} to ${pct(result.rateHighPercent)} gives this receipt.`;
  }
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">${input.mode === 'rate' ? 'Your sales tax rate' : 'Your sales tax'}</h2>
  ${statGrid(stats)}
  <p class="note">${note}</p>
</section>`;
}

export function salesTaxQuickResult({ input, result }) {
  if (input.mode === 'add') return html`<strong>${formatCurrency(result.total)}</strong> with ${formatCurrency(result.tax)} tax. <a href="#summary-heading">See full results</a>`;
  if (input.mode === 'remove') return html`<strong>${formatCurrency(result.price)}</strong> before ${formatCurrency(result.tax)} tax. <a href="#summary-heading">See full results</a>`;
  return html`<strong>${pct(result.ratePercent)}</strong> sales tax. <a href="#summary-heading">See full results</a>`;
}

export function salesTaxAnnouncement({ input, result }) {
  if (input.mode === 'add') return `Total with tax ${formatCurrency(result.total)}, including ${formatCurrency(result.tax)} sales tax.`;
  if (input.mode === 'remove') return `Price before tax ${formatCurrency(result.price)}; ${formatCurrency(result.tax)} of the total is sales tax.`;
  return `Sales tax rate ${pct(result.ratePercent)}.`;
}
