/**
 * Mulch Calculator form. Only the size inputs for the selected shape are
 * shown (CSS :has), so no page-specific script is needed.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { MULCH_DEFAULTS } from '../adapters/mulch.js';

export const MULCH_FIELD_IDS = Object.freeze({
  shape: 'mulch-shape',
  lengthFeet: 'mulch-length',
  widthFeet: 'mulch-width',
  diameterFeet: 'mulch-diameter',
  quantity: 'mulch-quantity',
  depthInches: 'mulch-depth',
  bagSize: 'mulch-bag-size',
  bagPrice: 'mulch-bag-price',
  pricePerYard: 'mulch-bulk-price',
  deliveryFee: 'mulch-delivery'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function mulchForm(values = MULCH_DEFAULTS, errors = {}, quick = null) {
  const ids = MULCH_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--mulch" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your beds</h3>
  ${radioField({
    id: ids.shape, name: 'shape', legend: 'Shape', value: values.shape,
    options: [
      { value: 'rect', label: 'Rectangular bed', id: 'mulch-shape-rect' },
      { value: 'round', label: 'Round bed or tree ring', id: 'mulch-shape-round' }
    ]
  })}
  <div class="mode-mulch-rect">
    ${field('lengthFeet', { label: 'Length', suffix: 'feet' })}
    ${field('widthFeet', { label: 'Width', suffix: 'feet' })}
  </div>
  <div class="mode-mulch-round">
    ${field('diameterFeet', { label: 'Diameter', suffix: 'feet' })}
  </div>
  ${field('quantity', { label: 'Number of beds this size', inputmode: 'numeric' })}
  ${field('depthInches', { label: 'Depth', suffix: 'inches', hint: 'Mulch is often spread 2 to 3 inches deep.' })}
  <h3 class="form-group-title">Bags or bulk</h3>
  ${field('bagSize', { label: 'Bag size', suffix: 'cu ft', hint: 'Common bags hold 2 or 3 cubic feet; check the label.' })}
  ${field('bagPrice', { label: 'Price per bag', prefix: '$', optional: true })}
  ${field('pricePerYard', { label: 'Bulk price per cubic yard', prefix: '$', optional: true })}
  ${field('deliveryFee', { label: 'Delivery fee for bulk', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
