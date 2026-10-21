/**
 * EV Charging Cost Calculator form: cost per charge, plus an optional
 * per-mile section. Efficiency starts blank (no default). Rendered at build
 * time and reused by the browser controller for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { choiceField } from './choice-field.js';
import { levelFields } from './charging-time-form.js';
import { EV_COST_DEFAULTS } from '../../adapters/energy/ev-charging-cost.js';

export const EV_COST_FIELD_IDS = Object.freeze({
  capacity: 'evcost-capacity',
  startLevel: 'evcost-start',
  targetLevel: 'evcost-target',
  efficiency: 'evcost-efficiency',
  rate: 'evcost-rate',
  figureType: 'evcost-figure-type',
  figure: 'evcost-figure',
  milesPerMonth: 'evcost-miles'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function evCostForm(values = EV_COST_DEFAULTS, errors = {}, quick = null) {
  const ids = EV_COST_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${levelFields(ids, values, errors, { start: 'Start charge level' })}
  ${field('efficiency', { label: 'Charging efficiency', suffix: '%', hint: 'The share of the energy from the wall that ends up in the battery.' })}
  ${field('rate', { label: 'Electricity rate', prefix: '$', suffix: 'per kWh', hint: 'The rate you pay for each extra kWh, not your bill\'s average.' })}
  ${choiceField({
    id: ids.figureType, name: 'figureType', legend: 'Cost per mile (optional)', value: values.figureType, error: errors.figureType,
    hint: 'For all-electric miles only. Plug-in hybrids that also use gasoline aren\'t covered.',
    options: [
      { value: '', label: 'Skip: cost per charge only' },
      { value: 'epa', label: 'EPA label kWh/100 mi (already includes charging losses)' },
      { value: 'dashboard', label: 'Dashboard mi/kWh' }
    ]
  })}
  ${field('figure', { label: 'Efficiency figure', optional: true, hint: 'kWh per 100 miles from the EPA label, or miles per kWh from the dashboard.' })}
  ${field('milesPerMonth', { label: 'Miles per month', suffix: 'miles', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
