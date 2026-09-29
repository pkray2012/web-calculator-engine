/**
 * Square Footage Calculator form: a shape, its dimensions in one unit, and
 * optional count and price. Only the selected shape's dimensions are shown
 * (CSS :has, no script needed). Rendered at build time and reused by the
 * browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { SQFT_DEFAULTS } from '../adapters/square-footage.js';
import { LENGTH_UNITS } from '../calculators/square-footage.js';

export const SQFT_FIELD_IDS = Object.freeze({
  shape: 'sqft-shape',
  unit: 'sqft-unit',
  length: 'sqft-length',
  width: 'sqft-width',
  diameter: 'sqft-diameter',
  base: 'sqft-base',
  triHeight: 'sqft-tri-height',
  sideA: 'sqft-side-a',
  sideB: 'sqft-side-b',
  trapHeight: 'sqft-trap-height',
  count: 'sqft-count',
  price: 'sqft-price'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function squareFootageForm(values = SQFT_DEFAULTS, errors = {}, quick = null) {
  const ids = SQFT_FIELD_IDS;
  const dim = (name, label, hint = null) => numberField({ id: ids[name], name, label, value: values[name], error: errors[name], hint });
  return html`<form class="calc-form calc-form--sqft" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.shape, name: 'shape', legend: 'Shape', value: values.shape,
    options: [
      { value: 'rect', label: 'Rectangle or square', id: 'sqft-shape-rect' },
      { value: 'circle', label: 'Circle', id: 'sqft-shape-circle' },
      { value: 'tri', label: 'Triangle', id: 'sqft-shape-tri' },
      { value: 'trap', label: 'Trapezoid', id: 'sqft-shape-trap' }
    ]
  })}
  <div class="field" data-field="${ids.unit}">
    <label for="${ids.unit}">Measured in</label>
    <div class="input">
      <select id="${ids.unit}" name="unit">
        ${Object.entries(LENGTH_UNITS).map(([value, { label }]) => html`<option value="${value}"${value === values.unit ? ' selected' : ''}>${label}</option>`)}
      </select>
    </div>
  </div>
  <div class="mode-rect">${dim('length', 'Length')}${dim('width', 'Width')}</div>
  <div class="mode-circle">${dim('diameter', 'Diameter', 'The distance across the circle through its center.')}</div>
  <div class="mode-tri">${dim('base', 'Base')}${dim('triHeight', 'Height', 'Measured at a right angle to the base.')}</div>
  <div class="mode-trap">${dim('sideA', 'Side a', 'One of the two parallel sides.')}${dim('sideB', 'Side b', 'The other parallel side.')}${dim('trapHeight', 'Height', 'The distance between the parallel sides.')}</div>
  <h3 class="form-group-title">Optional</h3>
  ${numberField({ id: ids.count, name: 'count', label: 'Number of identical areas', value: values.count, error: errors.count, optional: true, inputmode: 'numeric', hint: 'For example, three bedrooms of the same size.' })}
  ${numberField({ id: ids.price, name: 'price', label: 'Price per square foot', prefix: '$', value: values.price, error: errors.price, optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
