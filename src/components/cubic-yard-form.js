/**
 * Cubic Yard Calculator form. The mode (volume or coverage) and the shape
 * show only their own inputs through CSS :has, so no page-specific script is
 * needed.
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { CUBIC_YARD_DEFAULTS } from '../adapters/cubic-yard.js';

export const CUBIC_YARD_FIELD_IDS = Object.freeze({
  mode: 'cy-mode',
  shape: 'cy-shape',
  lengthFeet: 'cy-length',
  widthFeet: 'cy-width',
  diameterFeet: 'cy-diameter',
  baseFeet: 'cy-base',
  heightFeet: 'cy-height',
  count: 'cy-count',
  cubicYards: 'cy-yards',
  depthInches: 'cy-depth',
  extraPercent: 'cy-extra',
  bagCubicFeet: 'cy-bag',
  truckYards: 'cy-truck',
  tonsPerYard: 'cy-density',
  pricePerYard: 'cy-price',
  deliveryFee: 'cy-delivery'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function cubicYardForm(values = CUBIC_YARD_DEFAULTS, errors = {}, quick = null) {
  const ids = CUBIC_YARD_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--cy" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${radioField({
    id: ids.mode, name: 'mode', legend: 'What do you want to know?', value: values.mode,
    options: [
      { value: 'volume', label: 'How many cubic yards I need for an area', id: 'cy-mode-volume' },
      { value: 'coverage', label: 'How much area a number of cubic yards covers', id: 'cy-mode-coverage' }
    ]
  })}
  <div class="mode-cy-volume">
    <h3 class="form-group-title">The area</h3>
    ${radioField({
      id: ids.shape, name: 'shape', legend: 'Shape', value: values.shape,
      options: [
        { value: 'rect', label: 'Rectangle or square', id: 'cy-shape-rect' },
        { value: 'round', label: 'Circle', id: 'cy-shape-round' },
        { value: 'triangle', label: 'Triangle', id: 'cy-shape-triangle' }
      ]
    })}
    <div class="mode-cy-rect">
      ${field('lengthFeet', { label: 'Length', suffix: 'feet' })}
      ${field('widthFeet', { label: 'Width', suffix: 'feet' })}
    </div>
    <div class="mode-cy-round">
      ${field('diameterFeet', { label: 'Diameter', suffix: 'feet' })}
    </div>
    <div class="mode-cy-triangle">
      ${field('baseFeet', { label: 'Base', suffix: 'feet' })}
      ${field('heightFeet', { label: 'Height', suffix: 'feet', hint: 'Measured straight out from the base to the far corner.' })}
    </div>
    ${field('count', { label: 'How many areas this size', inputmode: 'numeric', hint: 'For several identical beds, holes or planters.' })}
  </div>
  <div class="mode-cy-coverage">
    ${field('cubicYards', { label: 'Cubic yards you have or plan to order', suffix: 'cu yd' })}
  </div>
  ${field('depthInches', { label: 'Depth', suffix: 'inches' })}
  ${field('extraPercent', { label: 'Extra for settling and waste', suffix: '%', optional: true, hint: 'Loose soil, compost and mulch settle; 5% to 10% is common, more for fill that will be compacted.' })}
  <h3 class="form-group-title">Ordering (optional)</h3>
  ${field('bagCubicFeet', { label: 'Bag size', suffix: 'cu ft', optional: true, hint: 'Check the bag label; 0.75, 1, 1.5, 2 and 3 cubic feet are common.' })}
  ${field('truckYards', { label: 'Truck or trailer capacity', suffix: 'cu yd', optional: true })}
  ${field('tonsPerYard', { label: 'Weight per cubic yard', suffix: 'tons', optional: true, hint: 'Ask your supplier; it depends on the material and how wet it is.' })}
  ${field('pricePerYard', { label: 'Price per cubic yard', prefix: '$', optional: true })}
  ${field('deliveryFee', { label: 'Delivery fee', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
