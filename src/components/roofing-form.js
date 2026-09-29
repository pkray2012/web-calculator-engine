/**
 * Roofing Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { ROOFING_DEFAULTS } from '../adapters/roofing.js';

export const ROOFING_FIELD_IDS = Object.freeze({
  lengthFeet: 'roof-length',
  widthFeet: 'roof-width',
  pitchRise: 'roof-pitch',
  wastePercent: 'roof-waste',
  bundlesPerSquare: 'roof-bundles',
  pricePerBundle: 'roof-price'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function roofingForm(values = ROOFING_DEFAULTS, errors = {}, quick = null) {
  const ids = ROOFING_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The roof</h3>
  ${field('lengthFeet', { label: 'Length of the house', suffix: 'feet', hint: 'Measured on the ground, including the overhang at each end.' })}
  ${field('widthFeet', { label: 'Width of the house', suffix: 'feet', hint: 'Including the overhang on each side.' })}
  ${field('pitchRise', { label: 'Roof pitch', suffix: 'in 12', hint: 'Inches of rise per 12 inches of run; 4 to 8 is common. Enter 0 for a flat roof.' })}
  <h3 class="form-group-title">The shingles</h3>
  ${field('wastePercent', { label: 'Extra for cuts and waste', suffix: '%', optional: true, hint: 'About 10% for a simple gable roof, 15% for a hip roof or dormers, more for complex roofs.' })}
  ${field('bundlesPerSquare', { label: 'Bundles per square', hint: 'Printed on the wrapper: usually 3, sometimes 4 for heavier shingles. A square is 100 sq ft.' })}
  ${field('pricePerBundle', { label: 'Price per bundle', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
