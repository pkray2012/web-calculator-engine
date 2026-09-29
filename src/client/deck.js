/**
 * Browser entry for the Deck Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runDeckCalculator, DECK_DEFAULTS } from '../adapters/deck.js';
import { deckResults, deckQuickResult, deckAnnouncement } from '../components/deck-results.js';
import { DECK_FIELD_IDS } from '../components/deck-form.js';

mountCalculator({
  defaults: DECK_DEFAULTS,
  fieldIds: DECK_FIELD_IDS,
  run: runDeckCalculator,
  render: deckResults,
  quick: deckQuickResult,
  announce: deckAnnouncement
});
