/**
 * Estimated Tax Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, checkboxField } from './fields.js';
import { ESTIMATED_TAX_DEFAULTS } from '../adapters/estimated-tax.js';

export const ESTIMATED_TAX_FIELD_IDS = Object.freeze({
  currentYearTax: 'est-current-tax',
  currentYearRefundableCredits: 'est-current-credits',
  withholding: 'est-withholding',
  priorYearTax: 'est-prior-tax',
  priorYearRefundableCredits: 'est-prior-credits',
  priorYearAgi: 'est-prior-agi',
  marriedFilingSeparately: 'est-mfs'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function estimatedTaxForm(values = ESTIMATED_TAX_DEFAULTS, errors = {}, quick = null) {
  const ids = ESTIMATED_TAX_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">This year (2026)</h3>
  ${field('currentYearTax', { label: 'Expected total tax', prefix: '$', hint: 'Your estimate of the total tax line on your 2026 Form 1040: income tax after credits, plus self-employment tax and other taxes.' })}
  ${field('currentYearRefundableCredits', { label: 'Expected refundable credits', prefix: '$', optional: true, hint: 'Credits paid to you even beyond your tax, such as the earned income credit or the additional child tax credit. On Form 1040 they appear with payments, not in the total tax.' })}
  ${field('withholding', { label: 'Federal tax withheld', prefix: '$', optional: true, hint: 'From paychecks, pensions and other income for the whole year.' })}
  <h3 class="form-group-title">Last year (2025)</h3>
  ${field('priorYearTax', { label: 'Total tax on last year’s return', prefix: '$', optional: true, hint: 'The total tax line on your 2025 Form 1040. Enter 0 if you owed no tax for the full year; leave blank if you do not know it.' })}
  ${field('priorYearRefundableCredits', { label: 'Refundable credits on last year’s return', prefix: '$', optional: true, hint: 'The same kinds of credits, from your 2025 return.' })}
  ${field('priorYearAgi', { label: 'Adjusted gross income on last year’s return', prefix: '$', optional: true, hint: 'Needed whenever you enter last year’s tax.' })}
  ${checkboxField({ id: ids.marriedFilingSeparately, name: 'marriedFilingSeparately', label: 'Married filing separately this year', checked: values.marriedFilingSeparately === 'on' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
