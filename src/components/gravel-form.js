/**
 * Gravel Calculator form. Only the size inputs for the selected shape are
 * shown (CSS :has), so no page-specific script is needed.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { GRAVEL_DEFAULTS } from '../adapters/gravel.js';

export const GRAVEL_FIELD_IDS = Object.freeze({
  shape: 'gravel-shape',
  lengthFeet: 'gravel-length',
  widthFeet: 'gravel-width',
  diameterFeet: 'gravel-diameter',
  depthInches: 'gravel-depth',
  extraPercent: 'gravel-extra',
  tonsPerYard: 'gravel-density',
  pricePerTon: 'gravel-price-ton',
  pricePerYard: 'gravel-price-yard',
  deliveryFee: 'gravel-delivery'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function gravelForm(values = GRAVEL_DEFAULTS, errors = {}, quick = null) {
  const ids = GRAVEL_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--gravel" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The area</h3>
  ${radioField({
    id: ids.shape, name: 'shape', legend: 'Shape', value: values.shape,
    options: [
      { value: 'rect', label: 'Rectangle: driveway, path or patio base', id: 'gravel-shape-rect' },
      { value: 'round', label: 'Circle: bed or tree ring', id: 'gravel-shape-round' }
    ]
  })}
  <div class="mode-gravel-rect">
    ${field('lengthFeet', { label: 'Length', suffix: 'feet' })}
    ${field('widthFeet', { label: 'Width', suffix: 'feet' })}
  </div>
  <div class="mode-gravel-round">
    ${field('diameterFeet', { label: 'Diameter', suffix: 'feet' })}
  </div>
  ${field('depthInches', { label: 'Depth', suffix: 'inches' })}
  ${field('extraPercent', { label: 'Extra for compaction and waste', suffix: '%', optional: true, hint: '5% to 10% is common; more for a base that will be compacted.' })}
  <h3 class="form-group-title">The material</h3>
  ${field('tonsPerYard', { label: 'Weight per cubic yard', suffix: 'tons', hint: 'Many gravels are about 1.4 to 1.7 tons per cubic yard. Ask your supplier for yours.' })}
  <h3 class="form-group-title">Cost (optional)</h3>
  ${field('pricePerTon', { label: 'Price per ton', prefix: '$', optional: true })}
  ${field('pricePerYard', { label: 'Price per cubic yard', prefix: '$', optional: true, hint: 'Suppliers sell by the ton or by the yard; enter whichever you were quoted.' })}
  ${field('deliveryFee', { label: 'Delivery fee', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
