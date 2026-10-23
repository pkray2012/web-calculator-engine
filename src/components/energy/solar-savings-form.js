/**
 * Solar Savings Calculator form. The share used at home and the export credit
 * start blank (no default). Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { SOLAR_SAVINGS_DEFAULTS } from '../../adapters/energy/solar-savings.js';

export const SOLAR_SAVINGS_FIELD_IDS = Object.freeze({
  production: 'solsav-production',
  selfUse: 'solsav-self-use',
  retailRate: 'solsav-retail',
  exportRate: 'solsav-export',
  fees: 'solsav-fees'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function solarSavingsForm(values = SOLAR_SAVINGS_DEFAULTS, errors = {}, quick = null) {
  const ids = SOLAR_SAVINGS_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('production', { label: 'Yearly solar production', suffix: 'kWh', hint: 'From your installer\'s estimate or your system\'s monitoring.' })}
  ${field('selfUse', { label: 'Share used at home', suffix: '%', hint: 'The part of the production you use as it is made; the rest is sent to the grid.' })}
  ${field('retailRate', { label: 'Retail rate', prefix: '$', suffix: 'per kWh', hint: 'The rate you pay for each extra kWh, not your bill\'s average.' })}
  ${field('exportRate', { label: 'Export credit', prefix: '$', suffix: 'per kWh', hint: 'The credit your plan gives for each kWh sent to the grid.' })}
  ${field('fees', { label: 'Yearly solar fees', prefix: '$', suffix: 'a year', optional: true, hint: 'Any yearly charges your utility adds for solar customers.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
