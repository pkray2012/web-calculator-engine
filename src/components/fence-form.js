/**
 * Fence Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { FENCE_DEFAULTS } from '../adapters/fence.js';

export const FENCE_FIELD_IDS = Object.freeze({
  lengthFeet: 'fence-length',
  postSpacingFeet: 'fence-spacing',
  railsPerSection: 'fence-rails',
  picketWidthInches: 'fence-picket-width',
  gapInches: 'fence-gap',
  wastePercent: 'fence-waste',
  pricePerPost: 'fence-price-post',
  pricePerRail: 'fence-price-rail',
  pricePerPicket: 'fence-price-picket'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function fenceForm(values = FENCE_DEFAULTS, errors = {}, quick = null) {
  const ids = FENCE_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The fence line</h3>
  ${field('lengthFeet', { label: 'Fence length', suffix: 'feet', hint: 'Add up every side you are fencing.' })}
  ${field('postSpacingFeet', { label: 'Post spacing', suffix: 'feet', hint: '8 feet is common for wood fences; 6 feet for heavier or taller fences.' })}
  ${field('railsPerSection', { label: 'Rails per section', inputmode: 'numeric', hint: 'Often 2 for a fence up to 4 feet and 3 for a 6-foot fence.' })}
  <h3 class="form-group-title">The pickets</h3>
  ${field('picketWidthInches', { label: 'Picket width', suffix: 'inches', hint: 'Actual width: a nominal 1 × 6 board is about 5.5 inches.' })}
  ${field('gapInches', { label: 'Gap between pickets', suffix: 'inches', optional: true, hint: 'Enter 0 for boards butted together.' })}
  ${field('wastePercent', { label: 'Extra pickets', suffix: '%', optional: true, hint: 'For split or warped boards; 5% is typical.' })}
  <h3 class="form-group-title">Cost (optional)</h3>
  ${field('pricePerPost', { label: 'Price per post', prefix: '$', optional: true })}
  ${field('pricePerRail', { label: 'Price per rail', prefix: '$', optional: true })}
  ${field('pricePerPicket', { label: 'Price per picket', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
