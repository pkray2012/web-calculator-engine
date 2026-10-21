/**
 * Solar Financing Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField, amountWithUnitField } from '../fields.js';
import { FINANCING_DEFAULTS } from '../../adapters/energy/solar-financing.js';

export const FINANCING_FIELD_IDS = Object.freeze({
  price: 'fin-price',
  down: 'fin-down',
  purchaseRebates: 'fin-purchase-rebates',
  laterRebates: 'fin-later-rebates',
  rate: 'fin-rate',
  term: 'fin-term',
  termUnit: 'fin-term-unit',
  fees: 'fin-fees'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function financingForm(values = FINANCING_DEFAULTS, errors = {}, quick = null) {
  const ids = FINANCING_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('price', { label: 'System price', prefix: '$', hint: 'The total installed price on the quote.' })}
  ${field('down', { label: 'Down payment', prefix: '$', optional: true })}
  ${field('purchaseRebates', { label: 'Rebates applied at purchase', prefix: '$', optional: true, hint: 'Rebates that reduce the amount you borrow.' })}
  ${field('laterRebates', { label: 'Rebates or incentives received later', prefix: '$', optional: true, hint: 'These don\'t reduce your loan unless you use them to pay it down.' })}
  ${field('rate', { label: 'Loan interest rate', suffix: '%', hint: 'The rate on your loan agreement, not the APR. If your loan has no fees, they are the same.' })}
  ${amountWithUnitField({
    id: ids.term, name: 'term', unitName: 'termUnit', legend: 'Loan term', value: values.term, unit: values.termUnit, error: errors.term,
    units: [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }]
  })}
  ${field('fees', { label: 'Fees added to the loan', prefix: '$', optional: true, hint: 'Origination or other fees you borrow rather than pay up front.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
