/**
 * Results panel for the Profit Margin Calculator. Pure function of the view
 * model from src/adapters/margin.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCount } from '../lib/format.js';
import { statGrid } from './results.js';

const pct = (value) => `${Number(value.toFixed(2)).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;

export function marginResults({ input, sale }) {
  const priceFound = input.mode !== 'cp';
  const loss = sale.profit < 0;
  const primary = priceFound
    ? { label: 'Selling price', value: formatCurrency(sale.price), primary: true, note: `For a ${pct(sale.marginPercent)} margin on ${formatCurrency(sale.cost)} cost` }
    : { label: 'Profit margin', value: pct(sale.marginPercent), primary: true, note: `${formatCurrency(sale.profit)} ${loss ? 'loss' : 'profit'} on a ${formatCurrency(sale.price)} sale` };
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">${priceFound ? 'Your selling price' : 'Your margin and markup'}</h2>
  ${statGrid([
    primary,
    ...(priceFound ? [{ label: 'Profit margin', value: pct(sale.marginPercent), note: 'Profit ÷ selling price' }] : []),
    { label: 'Markup', value: sale.markupPercent === null ? '—' : pct(sale.markupPercent), note: sale.markupPercent === null ? 'Not defined for a zero cost' : 'Profit ÷ cost' },
    { label: loss ? 'Loss per unit' : 'Profit per unit', value: formatCurrency(Math.abs(sale.profit)), note: `${formatCurrency(sale.price)} − ${formatCurrency(sale.cost)}` },
    ...(sale.breakEvenUnits !== null ? [{ label: 'Break-even', value: `${formatCount(sale.breakEvenUnits)} units`, note: `To cover ${formatCurrency(sale.fixedCosts)} of fixed costs` }] : [])
  ])}
  ${loss ? html`<p class="note">The selling price is below cost, so each sale loses money.</p>` : ''}
  ${input.fixedCosts > 0 && sale.breakEvenUnits === null ? html`<p class="note">There is no break-even point: each unit needs to sell for more than it costs.</p>` : ''}
</section>`;
}

export function marginQuickResult({ input, sale }) {
  if (input.mode !== 'cp') return html`Sell at <strong>${formatCurrency(sale.price)}</strong> for a ${pct(sale.marginPercent)} margin (${pct(sale.markupPercent)} markup). <a href="#summary-heading">See full results</a>`;
  return html`<strong>${pct(sale.marginPercent)} margin</strong>${sale.markupPercent === null ? '' : html`, ${pct(sale.markupPercent)} markup`}. <a href="#summary-heading">See full results</a>`;
}

export function marginAnnouncement({ input, sale }) {
  const markup = sale.markupPercent === null ? '' : `, markup ${pct(sale.markupPercent)}`;
  if (input.mode !== 'cp') return `Selling price ${formatCurrency(sale.price)}: margin ${pct(sale.marginPercent)}${markup}.`;
  return `Profit margin ${pct(sale.marginPercent)}${markup}.`;
}
