/**
 * Asphalt Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { ASPHALT_DEFAULTS } from '../adapters/asphalt.js';

export const ASPHALT_FIELD_IDS = Object.freeze({
  lengthFeet: 'asphalt-length',
  widthFeet: 'asphalt-width',
  thicknessInches: 'asphalt-thickness',
  densityLbPerCuFt: 'asphalt-density',
  wastePercent: 'asphalt-waste',
  pricePerTon: 'asphalt-price'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function asphaltForm(values = ASPHALT_DEFAULTS, errors = {}, quick = null) {
  const ids = ASPHALT_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The area</h3>
  ${field('lengthFeet', { label: 'Length', suffix: 'feet' })}
  ${field('widthFeet', { label: 'Width', suffix: 'feet' })}
  ${field('thicknessInches', { label: 'Thickness', suffix: 'inches', hint: 'Compacted thickness. Driveways are often 2 to 3 inches over a gravel base; ask your contractor.' })}
  <h3 class="form-group-title">Ordering</h3>
  ${field('densityLbPerCuFt', { label: 'Density', suffix: 'lb per cu ft', optional: true, hint: '145 is a common planning figure for compacted hot-mix asphalt. Your supplier can give the figure for their mix.' })}
  ${field('wastePercent', { label: 'Extra', suffix: '%', optional: true, hint: 'For uneven grade and edges; 5 to 10% is common.' })}
  ${field('pricePerTon', { label: 'Price per ton', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
