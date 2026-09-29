/**
 * Balance Transfer Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { TRANSFER_DEFAULTS } from '../adapters/balance-transfer.js';

export const TRANSFER_FIELD_IDS = Object.freeze({
  balance: 'transfer-balance',
  currentApr: 'current-apr',
  monthlyPayment: 'transfer-payment',
  transferFee: 'transfer-fee',
  introApr: 'intro-apr',
  introMonths: 'intro-months',
  postIntroApr: 'post-intro-apr'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function balanceTransferForm(values = TRANSFER_DEFAULTS, errors = {}, quick = null) {
  const ids = TRANSFER_FIELD_IDS;
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your current card</h3>
  ${numberField({ id: ids.balance, name: 'balance', label: 'Balance to transfer', prefix: '$', value: values.balance, error: errors.balance })}
  ${numberField({ id: ids.currentApr, name: 'currentApr', label: 'Current card APR', suffix: '%', value: values.currentApr, error: errors.currentApr })}
  ${numberField({ id: ids.monthlyPayment, name: 'monthlyPayment', label: 'Monthly payment', prefix: '$', value: values.monthlyPayment, hint: 'What you will pay each month either way.', error: errors.monthlyPayment })}
  <h3 class="form-group-title">The balance transfer offer</h3>
  ${numberField({ id: ids.transferFee, name: 'transferFee', label: 'Balance transfer fee', suffix: '%', value: values.transferFee, optional: true, hint: 'A percentage of the amount moved, often 3% to 5%. Check the offer terms.', error: errors.transferFee })}
  ${numberField({ id: ids.introApr, name: 'introApr', label: 'Intro APR', suffix: '%', value: values.introApr, optional: true, hint: '0 for a 0% offer.', error: errors.introApr })}
  ${numberField({ id: ids.introMonths, name: 'introMonths', label: 'Intro period', suffix: 'months', value: values.introMonths, inputmode: 'numeric', error: errors.introMonths })}
  ${numberField({ id: ids.postIntroApr, name: 'postIntroApr', label: 'APR after the intro period', suffix: '%', value: values.postIntroApr, error: errors.postIntroApr })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
