/**
 * Results panel for the Percentage Calculator. Pure function of the view
 * model from src/adapters/percentage.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid } from './results.js';

export const fmt = (value) => Number(value.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 4 });
const pct = (value) => `${fmt(value)}%`;
const signed = (value) => `${value > 0 ? '+' : ''}${fmt(value)}%`;

function summary({ input, result }) {
  if (input.mode === 'of') return { heading: 'Your answer', stats: [{ label: `${fmt(result.percent)}% of ${fmt(result.of)}`, value: fmt(result.result), primary: true, note: `${fmt(result.of)} × ${fmt(result.percent)} ÷ 100` }] };
  if (input.mode === 'is') return { heading: 'Your answer', stats: [{ label: `${fmt(result.part)} out of ${fmt(result.whole)}`, value: pct(result.percent), primary: true, note: `${fmt(result.part)} ÷ ${fmt(result.whole)} × 100` }] };
  if (input.mode === 'change') {
    const direction = result.change > 0 ? 'increase' : result.change < 0 ? 'decrease' : 'no change';
    return {
      heading: 'Your percent change',
      stats: [
        { label: `Percent ${direction === 'no change' ? 'change' : direction}`, value: signed(result.percent), primary: true, note: `${fmt(result.from)} → ${fmt(result.to)}: ${result.change >= 0 ? '+' : ''}${fmt(result.change)}` },
        ...(result.reversePercent !== null ? [{ label: 'To go back', value: signed(result.reversePercent), note: `From ${fmt(result.to)} to ${fmt(result.from)}` }] : []),
        { label: 'Percent difference', value: pct(result.differencePercent), note: 'Compared with the average of the two' }
      ]
    };
  }
  return {
    heading: 'Your sale price',
    stats: [
      { label: 'Sale price', value: formatCurrency(result.salePrice), primary: true, note: `${formatCurrency(result.price)} with ${fmt(result.percent)}% off${result.extraPercent ? ` then ${fmt(result.extraPercent)}% off` : ''}` },
      { label: 'You save', value: formatCurrency(result.saving), note: result.extraPercent ? `${fmt(result.totalPercentOff)}% off in total, not ${fmt(result.percent + result.extraPercent)}%` : `${fmt(result.percent)}% of ${formatCurrency(result.price)}` }
    ]
  };
}

export function percentResults(view) {
  const { heading, stats } = summary(view);
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">${heading}</h2>
  ${statGrid(stats)}
</section>`;
}

export function percentQuickResult(view) {
  const { stats } = summary(view);
  return html`${stats[0].label}: <strong>${stats[0].value}</strong>. <a href="#summary-heading">See full results</a>`;
}

export function percentAnnouncement(view) {
  const { stats } = summary(view);
  return `${stats[0].label}: ${stats[0].value}.`;
}
