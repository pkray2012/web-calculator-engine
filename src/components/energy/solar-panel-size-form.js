/**
 * Solar Panel Size Calculator form. Peak sun hours and losses start blank (no
 * default). Rendered at build time and reused by the browser controller for
 * field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { SIZE_DEFAULTS } from '../../adapters/energy/solar-panel-size.js';

export const SUN_HOURS_HINT = 'From a solar resource map, your installer or a solar design tool. There is no default.';
export const LOSSES_HINT = 'The share of the rated output you expect to lose, from your installer or design tool. There is no default.';

export const SIZE_FIELD_IDS = Object.freeze({
  annualKwh: 'panelsize-annual',
  sunHours: 'panelsize-sun',
  losses: 'panelsize-losses',
  panelWatts: 'panelsize-panel'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function sizeForm(values = SIZE_DEFAULTS, errors = {}, quick = null) {
  const ids = SIZE_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('annualKwh', { label: 'Yearly electricity use', suffix: 'kWh', hint: 'The kWh a year you want the system to cover, for example from 12 months of bills.' })}
  ${field('sunHours', { label: 'Peak sun hours', suffix: 'hours a day', hint: SUN_HOURS_HINT })}
  ${field('losses', { label: 'System losses', suffix: '%', hint: LOSSES_HINT })}
  ${field('panelWatts', { label: 'Panel rating', suffix: 'watts', optional: true, hint: 'One panel\'s watt rating, to count the panels.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
