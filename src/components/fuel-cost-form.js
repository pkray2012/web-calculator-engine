/**
 * Fuel Cost Calculator form: trip cost, or MPG from a fill-up. Only the
 * inputs for the selected mode are shown (CSS :has, no script needed).
 * Rendered at build time and reused by the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, checkboxField, radioField } from './fields.js';
import { FUEL_DEFAULTS } from '../adapters/fuel-cost.js';

export const FUEL_FIELD_IDS = Object.freeze({
  mode: 'fuel-mode',
  distanceMiles: 'fuel-distance',
  mpg: 'fuel-mpg',
  pricePerGallon: 'fuel-price',
  roundTrip: 'fuel-round-trip',
  people: 'fuel-people',
  compareMpg: 'fuel-compare-mpg',
  milesDriven: 'fuel-miles-driven',
  gallonsUsed: 'fuel-gallons'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function fuelForm(values = FUEL_DEFAULTS, errors = {}, quick = null) {
  const ids = FUEL_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--fuel" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'What do you want to work out?', value: values.mode,
    options: [
      { value: 'trip', label: 'Fuel cost of a trip', id: 'fuel-mode-trip' },
      { value: 'mpg', label: 'My MPG from a fill-up', id: 'fuel-mode-mpg' }
    ]
  })}
  <div class="mode-trip">
    ${field('distanceMiles', { label: 'Distance', suffix: 'miles', hint: 'One way. Tick round trip below to double it.' })}
    ${checkboxField({ id: ids.roundTrip, name: 'roundTrip', label: 'Round trip', checked: values.roundTrip === 'on' })}
    ${field('mpg', { label: 'Fuel economy', suffix: 'MPG', hint: 'Your own figure from a fill-up is more accurate than the EPA rating.' })}
  </div>
  ${field('pricePerGallon', { label: 'Gas price', prefix: '$', suffix: 'a gallon', hint: 'Needed for trip cost; optional for MPG.' })}
  <div class="mode-trip">
    ${field('people', { label: 'People sharing the cost', inputmode: 'numeric', optional: true })}
    ${field('compareMpg', { label: 'Compare with', suffix: 'MPG', optional: true, hint: 'Another car\'s MPG, to see the difference for the same trip.' })}
  </div>
  <div class="mode-mpg">
    ${field('milesDriven', { label: 'Miles driven', suffix: 'miles', hint: 'Since the last time you filled the tank (reset the trip meter at the pump).' })}
    ${field('gallonsUsed', { label: 'Gallons to fill up', suffix: 'gallons', hint: 'From the pump when you fill the tank again.' })}
  </div>
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
