/**
 * Results panel for the Self-Employment Tax Calculator. Pure function of the
 * view model from src/adapters/self-employment-tax.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

export function selfEmploymentTaxResults({ result }) {
  const r = result;
  const stats = [
    { label: 'Self-employment tax', value: formatCurrency(r.selfEmploymentTax), primary: true, note: `Social Security ${formatCurrency(r.socialSecurityTax)} + Medicare ${formatCurrency(r.medicareTax)}` },
    { label: 'Deductible half', value: formatCurrency(r.deductibleHalf), note: 'Reduces adjusted gross income for income tax' },
    { label: 'Additional Medicare Tax', value: formatCurrency(r.additionalMedicareTax), note: r.additionalMedicareTax > 0 ? '0.9% on Form 8959, not part of SE tax' : `None: under the ${formatCurrency(r.threshold)} threshold` },
    { label: 'Share of net profit', value: formatPercent(r.effectiveRateOnProfit * 100), note: 'SE tax plus Additional Medicare Tax ÷ net profit' }
  ];
  let note;
  if (r.belowMinimum && r.netProfit > 0) note = `Net earnings of ${formatCurrency(r.rawNetEarnings)} are under $400, so no self-employment tax is due.`;
  else if (r.netProfit <= 0) note = 'There is no self-employment tax on a loss or zero profit.';
  else if (r.socialSecurityCapped) note = `Only ${formatCurrency(r.socialSecurityEarnings)} of your net earnings is taxed for Social Security: the ${r.taxYear} wage base is ${formatCurrency(r.wageBase)}${r.socialSecurityWages > 0 ? `, and your W-2 wages already used ${formatCurrency(Math.min(r.socialSecurityWages, r.wageBase))} of it` : ''}.`;
  else note = 'All of your net earnings are under the Social Security wage base, so the full 15.3% applies.';
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your self-employment tax for ${r.taxYear}</h2>
  ${statGrid(stats)}
  <p class="note">${note}</p>
</section>
<section class="result-block" aria-labelledby="lines-heading">
  <h2 id="lines-heading">Line by line</h2>
  ${dataTable({
    id: 'se-lines',
    title: 'How the tax is worked out',
    columns: [{ key: 'step', label: 'Step' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows: [
      { step: 'Net profit', amount: formatCurrency(r.netProfit) },
      { step: 'Net earnings from self-employment (× 92.35%)', amount: formatCurrency(r.netEarnings) },
      { step: `Social Security wage base left (${r.taxYear} base ${formatCurrency(r.wageBase)} − W-2 wages)`, amount: formatCurrency(r.wageBaseLeft) },
      { step: 'Social Security tax (12.4% × the smaller of the two)', amount: formatCurrency(r.socialSecurityTax) },
      { step: 'Medicare tax (2.9% × net earnings)', amount: formatCurrency(r.medicareTax) },
      { step: 'Self-employment tax', amount: formatCurrency(r.selfEmploymentTax) },
      { step: 'Deductible half of self-employment tax', amount: formatCurrency(r.deductibleHalf) },
      { step: `Additional Medicare Tax (0.9% above ${formatCurrency(r.thresholdLeft)} left of the threshold)`, amount: formatCurrency(r.additionalMedicareTax) }
    ]
  })}
</section>`;
}

export function selfEmploymentTaxQuickResult({ result }) {
  return html`<strong>${formatCurrency(result.selfEmploymentTax)}</strong> self-employment tax. <a href="#summary-heading">See full results</a>`;
}

export function selfEmploymentTaxAnnouncement({ result }) {
  const extra = result.additionalMedicareTax > 0 ? `, plus ${formatCurrency(result.additionalMedicareTax)} Additional Medicare Tax` : '';
  return `Self-employment tax ${formatCurrency(result.selfEmploymentTax)}${extra}. Deductible half ${formatCurrency(result.deductibleHalf)}.`;
}
