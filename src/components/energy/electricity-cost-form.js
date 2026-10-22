/**
 * Electricity Cost Calculator form. Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { ELECTRICITY_COST_DEFAULTS } from '../../adapters/energy/electricity-cost.js';

export const ELECTRICITY_COST_FIELD_IDS = Object.freeze({
  watts: 'elcost-watts',
  hours: 'elcost-hours',
  days: 'elcost-days',
  rate: 'elcost-rate'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function electricityCostForm(values = ELECTRICITY_COST_DEFAULTS, errors = {}, quick = null) {
  const ids = ELECTRICITY_COST_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('watts', { label: 'Power', suffix: 'watts', hint: 'From the label or manual. Nameplate watts are a maximum.' })}
  ${field('hours', { label: 'Hours used per day', suffix: 'hours', hint: 'From 0 to 24.' })}
  ${field('days', { label: 'Days', suffix: 'days', inputmode: 'numeric', hint: 'For example 30 for a month or 365 for a year.' })}
  ${field('rate', { label: 'Electricity rate', prefix: '$', suffix: 'per kWh', hint: 'Dollars per kWh, for example 0.16 for 16¢.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
