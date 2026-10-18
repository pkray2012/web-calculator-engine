/**
 * Results panel for the Rent Affordability Calculator. Pure function of the
 * view model from src/adapters/rent-affordability.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency as formatRounded } from '../lib/format.js';
import { statGrid } from './results.js';
import { roundCents } from '../calculators/sales-tax.js';

const formatCurrency = (value) => formatRounded(roundCents(value));
const signed = (value) => (value < -0.005 ? `−${formatCurrency(-value)}` : formatCurrency(value));
/** A percentage that never reads as the line itself when it is over it (review A4-003). */
function burdenPercentText(percent, level) {
  const line = level === 'severe' ? 50 : level === 'burdened' ? 30 : null;
  for (const digits of [1, 2]) {
    const text = percent.toFixed(digits);
    if (line === null || Number(text) > line) return `${text}%`;
  }
  return `just over ${line}%`;
}

const BURDEN_TEXT = { none: 'not cost-burdened (30% or less)', burdened: 'cost-burdened (over 30%)', severe: 'severely cost-burdened (over 50%)' };

export function rentAffordabilityResults({ input, result: r }) {
  const stats = [
    { label: `Rent at ${input.housingSharePercent}% of income`, value: formatCurrency(r.guidelineRent), primary: true, note: `${formatCurrency(r.guidelineHousingCost)} for rent and utilities, minus ${formatCurrency(r.monthlyUtilities)} utilities` },
    { label: `Rent a ${input.incomeMultiple}× income screen allows`, value: formatCurrency(r.screenRent), note: `${formatCurrency(r.annualGrossIncome)} a year ÷ ${input.incomeMultiple}` }
  ];
  if (r.budget) stats.push({ label: 'Rent your budget leaves room for', value: formatCurrency(r.budget.rent), note: `${signed(r.budget.leftForHousing)} left for housing, minus utilities` });
  /** @type {unknown} */
  let considered = '';
  if (r.considered) {
    const c = r.considered;
    considered = html`<section class="result-block" aria-labelledby="considered-heading">
  <h2 id="considered-heading">${formatCurrency(c.rent)} a month</h2>
  <ul>
    <li>${c.burdenPercent === null ? 'With an income of $0, the share of income cannot be worked out.' : `Rent plus utilities would take ${burdenPercentText(c.burdenPercent, c.burdenLevel)} of gross income: ${BURDEN_TEXT[c.burdenLevel]}.`}</li>
    <li>A ${input.incomeMultiple}× screen asks for ${formatCurrency(c.incomeNeededForScreen)} a year; your income ${c.passesScreen ? 'meets it' : `is ${formatCurrency(c.incomeNeededForScreen - r.annualGrossIncome)} short`}.</li>
    ${c.leftAfterHousing === null ? '' : html`<li>Your budget would have ${signed(c.leftAfterHousing)} left after rent and utilities${c.leftAfterHousing < 0 ? ', so it does not fit' : ''}.</li>`}
  </ul>
</section>`;
  }
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Rent you can afford</h2>
  ${statGrid(stats)}
  <p class="note">The lowest of these, ${formatCurrency(r.lowestRent)} a month, fits every test you entered. ${r.severeRent > 0
    ? `Above ${formatCurrency(r.severeRent)}, rent and utilities would take more than half of gross income.`
    : 'Utilities alone already take half or more of gross income.'}</p>
</section>
${considered}`;
}

export function rentAffordabilityQuickResult({ result: r }) {
  return html`<strong>${formatCurrency(r.lowestRent)}</strong> a month fits every test. <a href="#summary-heading">See full results</a>`;
}

export function rentAffordabilityAnnouncement({ result: r }) {
  return `Rent of ${formatCurrency(r.lowestRent)} a month fits every test. ${formatCurrency(r.guidelineRent)} at the income share, ${formatCurrency(r.screenRent)} by the income screen.`;
}
