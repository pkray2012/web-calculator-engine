/**
 * Generic result building blocks: headline figures, a two-part breakdown bar
 * and responsive data tables. Values arrive pre-formatted as strings.
 */

import { html } from '../lib/html.js';

/** stats: [{ label, value, note?, primary? }] */
export function statGrid(stats) {
  return html`<dl class="stats">
  ${stats.map((stat) => html`<div class="stat${stat.primary ? ' stat--primary' : ''}">
    <dt class="stat__label">${stat.label}</dt>
    <dd class="stat__value">${stat.value}</dd>
    ${stat.note ? html`<dd class="stat__note">${stat.note}</dd>` : ''}
  </div>`)}
</dl>`;
}

/**
 * Horizontal bar split into two parts. Proportions are also given as text,
 * so the bar is decorative for assistive technology.
 */
export function breakdownBar({ label, parts }) {
  const total = parts.reduce((sum, part) => sum + part.amount, 0);
  const pct = (amount) => (total > 0 ? (amount / total) * 100 : 0);
  return html`<figure class="breakdown">
  <figcaption class="breakdown__label">${label}</figcaption>
  <div class="breakdown__bar" aria-hidden="true">
    ${parts.map((part, index) => html`<span class="breakdown__part breakdown__part--${index}" style="width:${pct(part.amount).toFixed(2)}%"></span>`)}
  </div>
  <ul class="breakdown__legend">
    ${parts.map((part, index) => html`<li><span class="breakdown__swatch breakdown__part--${index}" aria-hidden="true"></span>${part.label}: <strong>${part.display}</strong> (${pct(part.amount).toFixed(1)}%)</li>`)}
  </ul>
</figure>`;
}

/**
 * Accessible table in a keyboard-scrollable region. The visible title sits
 * outside the scroller (so it is never clipped) and names both the region
 * and the table.
 * columns: [{ key, label, numeric? }]; the first column is the row header.
 * rows: objects of display strings; a row with selected: true is highlighted.
 */
export function dataTable({ id, title, columns, rows }) {
  const [first, ...rest] = columns;
  return html`<p class="table-title" id="${id}-title">${title}</p>
<div class="table-scroll" role="region" aria-labelledby="${id}-title" tabindex="0">
  <table class="data-table" id="${id}" aria-labelledby="${id}-title">
    <thead><tr>${columns.map((column) => html`<th scope="col"${column.numeric ? html` class="num"` : ''}>${column.label}</th>`)}</tr></thead>
    <tbody>
      ${rows.map((row) => html`<tr${row.selected ? html` class="is-selected" aria-current="true"` : ''}>
        <th scope="row"${first.numeric ? html` class="num"` : ''}>${row[first.key]}</th>
        ${rest.map((column) => html`<td${column.numeric ? html` class="num"` : ''}>${row[column.key]}</td>`)}
      </tr>`)}
    </tbody>
  </table>
</div>`;
}
