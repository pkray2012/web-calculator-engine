/**
 * Drywall Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, checkboxField, radioField } from './fields.js';
import { DRYWALL_DEFAULTS } from '../adapters/drywall.js';

export const DRYWALL_FIELD_IDS = Object.freeze({
  lengthFeet: 'drywall-length',
  widthFeet: 'drywall-width',
  heightFeet: 'drywall-height',
  includeCeiling: 'drywall-ceiling',
  doors: 'drywall-doors',
  doorArea: 'drywall-door-area',
  windows: 'drywall-windows',
  windowArea: 'drywall-window-area',
  wastePercent: 'drywall-waste',
  sheet: 'drywall-sheet',
  pricePerSheet: 'drywall-price'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function drywallForm(values = DRYWALL_DEFAULTS, errors = {}, quick = null) {
  const ids = DRYWALL_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">The room</h3>
  ${field('lengthFeet', { label: 'Room length', suffix: 'feet' })}
  ${field('widthFeet', { label: 'Room width', suffix: 'feet' })}
  ${field('heightFeet', { label: 'Wall height', suffix: 'feet', hint: 'Floor to ceiling; 8 feet is common.' })}
  ${checkboxField({ id: ids.includeCeiling, name: 'includeCeiling', label: 'Include the ceiling', checked: values.includeCeiling === 'on' })}
  <h3 class="form-group-title">Doors and windows</h3>
  ${field('doors', { label: 'Number of doors', optional: true, inputmode: 'numeric' })}
  ${field('doorArea', { label: 'Area of each door', suffix: 'sq ft', optional: true, hint: 'A 3 × 7 ft door is 21 sq ft.' })}
  ${field('windows', { label: 'Number of windows', optional: true, inputmode: 'numeric' })}
  ${field('windowArea', { label: 'Area of each window', suffix: 'sq ft', optional: true, hint: 'Width × height in feet; 3 × 4 ft is 12 sq ft.' })}
  <h3 class="form-group-title">The drywall</h3>
  ${radioField({
    id: ids.sheet, name: 'sheet', legend: 'Sheet size', value: values.sheet,
    options: [
      { value: '4x8', label: '4 × 8 ft (32 sq ft)', id: 'drywall-sheet-4x8' },
      { value: '4x10', label: '4 × 10 ft (40 sq ft)', id: 'drywall-sheet-4x10' },
      { value: '4x12', label: '4 × 12 ft (48 sq ft)', id: 'drywall-sheet-4x12' }
    ]
  })}
  ${field('wastePercent', { label: 'Extra for cuts and waste', suffix: '%', optional: true, hint: 'About 10% for a typical room; more for many corners or angles.' })}
  ${field('pricePerSheet', { label: 'Price per sheet', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
