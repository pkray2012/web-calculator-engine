/**
 * Self-Employment Tax Calculator form. Rendered at build time and reused by
 * the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { SE_TAX_DEFAULTS } from '../adapters/self-employment-tax.js';
import { TAX_YEARS } from '../calculators/self-employment-tax.js';

export const SE_TAX_FIELD_IDS = Object.freeze({
  taxYear: 'se-tax-year',
  netProfit: 'se-net-profit',
  w2Wages: 'se-w2-wages',
  filingStatus: 'se-filing-status',
  spouseW2Wages: 'se-spouse-w2-wages'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function selfEmploymentTaxForm(values = SE_TAX_DEFAULTS, errors = {}, quick = null) {
  const ids = SE_TAX_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.taxYear, name: 'taxYear', legend: 'Tax year', value: String(values.taxYear),
    options: TAX_YEARS.map((year) => ({ value: String(year), label: String(year), id: `se-tax-year-${year}` }))
  })}
  ${field('netProfit', { label: 'Net profit from self-employment', prefix: '$', hint: 'Business income minus business expenses for the year, as on Schedule C (or your share of partnership self-employment earnings).' })}
  ${field('w2Wages', { label: 'W-2 wages from a job', prefix: '$', optional: true, hint: 'Your own Medicare wages, W-2 box 5, from any employer, for the same year. Leave at 0 if you had no job.' })}
  ${radioField({
    id: ids.filingStatus, name: 'filingStatus', legend: 'Filing status', value: values.filingStatus,
    hint: 'Only affects the 0.9% Additional Medicare Tax threshold.',
    options: [
      { value: 'single', label: 'Single, head of household or qualifying surviving spouse', id: 'se-filing-single' },
      { value: 'marriedJointly', label: 'Married filing jointly', id: 'se-filing-joint' },
      { value: 'marriedSeparately', label: 'Married filing separately', id: 'se-filing-separate' }
    ]
  })}
  ${field('spouseW2Wages', { label: 'Spouse’s W-2 wages (joint filers only)', prefix: '$', optional: true, hint: 'Used only if you file jointly: your spouse’s Medicare wages, W-2 box 5. They count toward the joint $250,000 Additional Medicare Tax threshold, not toward your Social Security wage base.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
