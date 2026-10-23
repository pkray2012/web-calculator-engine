/**
 * EV Cost Per Mile Calculator form. Efficiency starts blank (no default) and
 * is used only with a trip-computer figure. Rendered at build time and reused by
 * the browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { choiceField } from './choice-field.js';
import { PER_MILE_DEFAULTS, EFFICIENCY_HINT } from '../../adapters/energy/ev-cost-per-mile.js';

export const PER_MILE_FIELD_IDS = Object.freeze({
  rate: 'permile-rate',
  figureType: 'permile-figure-type',
  figure: 'permile-figure',
  efficiency: 'permile-efficiency',
  annualMiles: 'permile-miles'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function perMileForm(values = PER_MILE_DEFAULTS, errors = {}, quick = null) {
  const ids = PER_MILE_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('rate', { label: 'Electricity rate', prefix: '$', suffix: 'per kWh', hint: 'The rate you pay for each extra kWh, not your bill\'s average.' })}
  ${choiceField({
    id: ids.figureType, name: 'figureType', legend: 'Which efficiency figure do you have?', value: values.figureType, error: errors.figureType,
    options: [
      { value: 'epa', label: 'EPA label kWh/100 mi (already includes charging losses)' },
      { value: 'dashboard', label: 'Trip computer mi/kWh (used as your vehicle reports it)' }
    ]
  })}
  ${field('figure', { label: 'Figure value', hint: 'kWh per 100 miles from the EPA label, or miles per kWh from your vehicle\'s trip computer.' })}
  ${field('efficiency', { label: 'Charging efficiency', suffix: '%', hint: EFFICIENCY_HINT })}
  ${field('annualMiles', { label: 'Miles per year', suffix: 'miles', optional: true, hint: 'For all-electric miles only. Plug-in hybrids that also use gasoline aren\'t covered.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
