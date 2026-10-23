/**
 * Solar Panel Output Calculator form. Peak sun hours and losses start blank
 * (no default). Rendered at build time and reused by the browser controller
 * for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { OUTPUT_DEFAULTS } from '../../adapters/energy/solar-panel-output.js';
import { SUN_HOURS_HINT, LOSSES_HINT } from './solar-panel-size-form.js';

export const OUTPUT_FIELD_IDS = Object.freeze({
  sizeKw: 'paneloutput-size',
  sunHours: 'paneloutput-sun',
  losses: 'paneloutput-losses'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function outputForm(values = OUTPUT_DEFAULTS, errors = {}, quick = null) {
  const ids = OUTPUT_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('sizeKw', { label: 'System size', suffix: 'kW DC', hint: 'The total of the panels\' ratings, as on the quote.' })}
  ${field('sunHours', { label: 'Peak sun hours', suffix: 'hours a day', hint: SUN_HOURS_HINT })}
  ${field('losses', { label: 'System losses', suffix: '%', hint: LOSSES_HINT })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
