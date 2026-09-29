/**
 * CD Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, monthField, radioField, amountWithUnitField } from './fields.js';
import { CD_DEFAULTS } from '../adapters/certificate-of-deposit.js';

export const CD_FIELD_IDS = Object.freeze({
  deposit: 'cd-deposit',
  ratePercent: 'cd-rate',
  rateType: 'cd-rate-type',
  compounding: 'cd-compounding',
  termValue: 'cd-term',
  openMonth: 'cd-open',
  taxPercent: 'cd-tax',
  penaltyMonths: 'cd-penalty',
  withdrawMonth: 'cd-withdraw'
});

const TERM_UNITS = [{ value: 'months', label: 'months' }, { value: 'years', label: 'years' }];

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function cdForm(values = CD_DEFAULTS, errors = {}, quick = null) {
  const ids = CD_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your CD</h3>
  ${field('deposit', { label: 'Deposit', prefix: '$' })}
  ${field('ratePercent', { label: 'Rate', suffix: '%', hint: 'Banks advertise the APY, which already includes compounding.' })}
  ${radioField({
    id: ids.rateType, name: 'rateType', legend: 'The rate is', value: values.rateType,
    options: [
      { value: 'apy', label: 'APY (annual percentage yield)', id: 'cd-rate-apy' },
      { value: 'apr', label: 'Interest rate before compounding', id: 'cd-rate-apr' }
    ]
  })}
  ${radioField({
    id: ids.compounding, name: 'compounding', legend: 'Interest compounds', value: values.compounding,
    hint: 'Check the account disclosure; daily and monthly are most common.',
    options: [
      { value: 'daily', label: 'Daily', id: 'cd-comp-daily' },
      { value: 'monthly', label: 'Monthly', id: 'cd-comp-monthly' },
      { value: 'quarterly', label: 'Quarterly', id: 'cd-comp-quarterly' },
      { value: 'annually', label: 'Annually', id: 'cd-comp-annually' }
    ]
  })}
  ${amountWithUnitField({ id: ids.termValue, name: 'termValue', unitName: 'termUnit', legend: 'CD term', value: values.termValue, unit: values.termUnit, units: TERM_UNITS, error: errors.termValue })}
  ${monthField({ id: ids.openMonth, name: 'openMonth', label: 'Opening month', value: values.openMonth, hint: 'Shows the month the CD matures.', error: errors.openMonth })}
  ${field('taxPercent', { label: 'Tax rate on interest', suffix: '%', optional: true, hint: 'Your federal plus state rate; CD interest is usually taxed as ordinary income.' })}
  <h3 class="form-group-title">Cashing in early (optional)</h3>
  ${field('withdrawMonth', { label: 'Cash in after', suffix: 'months', optional: true, inputmode: 'numeric', hint: 'Leave blank to see the full term.' })}
  ${field('penaltyMonths', { label: 'Early-withdrawal penalty', suffix: "months' interest", optional: true, hint: 'From the account disclosure, for example 3 months for a 1-year CD.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
