/**
 * Deck Calculator form. Rendered at build time and reused by the browser
 * controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { DECK_DEFAULTS } from '../adapters/deck.js';

export const DECK_FIELD_IDS = Object.freeze({
  widthFeet: 'deck-width',
  depthFeet: 'deck-depth',
  boardWidthInches: 'deck-board-width',
  gapInches: 'deck-gap',
  boardLengthFeet: 'deck-board-length',
  joistSpacingInches: 'deck-joist-spacing',
  wastePercent: 'deck-waste',
  screwsPerCrossing: 'deck-screws',
  pricePerBoard: 'deck-price-board',
  pricePerJoist: 'deck-price-joist'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function deckForm(values = DECK_DEFAULTS, errors = {}, quick = null) {
  const ids = DECK_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Deck size</h3>
  ${field('widthFeet', { label: 'Deck width', suffix: 'feet', hint: 'Along the house: the direction the deck boards run.' })}
  ${field('depthFeet', { label: 'Deck depth', suffix: 'feet', hint: 'Out from the house: the direction the joists run.' })}
  <h3 class="form-group-title">Deck boards</h3>
  ${field('boardWidthInches', { label: 'Board width', suffix: 'inches', hint: 'Actual width: 5/4 × 6 and 2 × 6 boards are about 5.5 inches. Check composite boards.' })}
  ${field('gapInches', { label: 'Gap between boards', suffix: 'inches', optional: true, hint: '1/8 inch (0.125) is common; follow the board maker\'s spacing.' })}
  ${field('boardLengthFeet', { label: 'Board length', suffix: 'feet', hint: 'Common lengths are 8, 10, 12, 16 and 20 feet.' })}
  ${field('wastePercent', { label: 'Extra boards', suffix: '%', optional: true, hint: 'For cuts and bad boards; 10% is typical for a straight layout.' })}
  <h3 class="form-group-title">Joists and screws</h3>
  ${field('joistSpacingInches', { label: 'Joist spacing', suffix: 'in. on center', hint: '16 inches is common. Composite and diagonal decking often need 12.' })}
  ${field('screwsPerCrossing', { label: 'Screws per joist', inputmode: 'numeric', optional: true, hint: 'Screws where each board crosses a joist, usually 2.' })}
  <h3 class="form-group-title">Cost (optional)</h3>
  ${field('pricePerBoard', { label: 'Price per board', prefix: '$', optional: true })}
  ${field('pricePerJoist', { label: 'Price per joist', prefix: '$', optional: true })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
