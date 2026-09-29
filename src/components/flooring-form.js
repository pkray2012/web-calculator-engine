/**
 * Flooring Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { FLOORING_DEFAULTS, FLOORING_ROOMS } from '../adapters/flooring.js';

export const FLOORING_FIELD_IDS = Object.freeze({
  ...Object.fromEntries(FLOORING_ROOMS.flatMap((n) => [[`room${n}Length`, `floor-room${n}-length`], [`room${n}Width`, `floor-room${n}-width`]])),
  wastePercent: 'floor-waste',
  boxCoverage: 'floor-box',
  pricePerSquareFoot: 'floor-price-sqft',
  pricePerBox: 'floor-price-box'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function flooringForm(values = FLOORING_DEFAULTS, errors = {}, quick = null) {
  const ids = FLOORING_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Rooms</h3>
  ${FLOORING_ROOMS.map((n) => html`${field(`room${n}Length`, { label: `Room ${n} length`, suffix: 'feet', optional: n > 1 })}
  ${field(`room${n}Width`, { label: `Room ${n} width`, suffix: 'feet', optional: n > 1, hint: n === 1 ? 'Split an L-shaped room into two rectangles.' : null })}`)}
  <h3 class="form-group-title">The flooring</h3>
  ${field('wastePercent', { label: 'Extra for cuts and waste', suffix: '%', optional: true, hint: 'About 5% for a simple room, 10% for a typical layout, 15% to 20% for diagonal or herringbone.' })}
  ${field('boxCoverage', { label: 'Coverage per box', suffix: 'sq ft', hint: 'Printed on the carton.' })}
  <h3 class="form-group-title">Cost (optional)</h3>
  ${field('pricePerSquareFoot', { label: 'Price per square foot', prefix: '$', optional: true })}
  ${field('pricePerBox', { label: 'Price per box', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
