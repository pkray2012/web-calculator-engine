/**
 * Concrete Calculator form. Only the size inputs for the selected shape are
 * shown (CSS :has), so no page-specific script is needed.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { CONCRETE_DEFAULTS } from '../adapters/concrete.js';

export const CONCRETE_FIELD_IDS = Object.freeze({
  shape: 'concrete-shape',
  lengthFeet: 'concrete-length',
  widthFeet: 'concrete-width',
  depthInches: 'concrete-thickness',
  diameterInches: 'concrete-diameter',
  depthFeet: 'concrete-depth',
  quantity: 'concrete-quantity',
  wastePercent: 'concrete-waste',
  yield40: 'concrete-yield-40',
  yield60: 'concrete-yield-60',
  yield80: 'concrete-yield-80',
  bagPrice80: 'concrete-bag-price',
  readyMixPricePerYard: 'concrete-ready-mix-price',
  deliveryFee: 'concrete-delivery'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function concreteForm(values = CONCRETE_DEFAULTS, errors = {}, quick = null) {
  const ids = CONCRETE_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--concrete" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">What you are pouring</h3>
  ${radioField({
    id: ids.shape, name: 'shape', legend: 'Shape', value: values.shape,
    options: [
      { value: 'rect', label: 'Slab, patio, footing or wall (rectangular)', id: 'concrete-shape-rect' },
      { value: 'round', label: 'Post holes or round columns', id: 'concrete-shape-round' }
    ]
  })}
  <div class="mode-rect">
    ${field('lengthFeet', { label: 'Length', suffix: 'feet' })}
    ${field('widthFeet', { label: 'Width', suffix: 'feet' })}
    ${field('depthInches', { label: 'Thickness', suffix: 'inches', hint: 'Patios and walkways are often 4 inches thick.' })}
  </div>
  <div class="mode-round">
    ${field('diameterInches', { label: 'Diameter', suffix: 'inches' })}
    ${field('depthFeet', { label: 'Depth', suffix: 'feet' })}
  </div>
  ${field('quantity', { label: 'How many', inputmode: 'numeric' })}
  ${field('wastePercent', { label: 'Extra for waste and uneven ground', suffix: '%', optional: true, hint: '5% to 10% is common.' })}
  <h3 class="form-group-title">Bag yields</h3>
  ${field('yield40', { label: '40 lb bag yield', suffix: 'cu ft', hint: 'Check the bag: yields vary by product.' })}
  ${field('yield60', { label: '60 lb bag yield', suffix: 'cu ft' })}
  ${field('yield80', { label: '80 lb bag yield', suffix: 'cu ft' })}
  <h3 class="form-group-title">Compare costs (optional)</h3>
  ${field('bagPrice80', { label: 'Price per 80 lb bag', prefix: '$', optional: true })}
  ${field('readyMixPricePerYard', { label: 'Ready-mix price per cubic yard', prefix: '$', optional: true })}
  ${field('deliveryFee', { label: 'Delivery and short-load fees', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
