/**
 * Browser entry for the Credit Card Payoff Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runCardCalculator, CARD_DEFAULTS } from '../adapters/credit-card-payoff.js';
import { creditCardResults, creditCardQuickResult, creditCardAnnouncement } from '../components/credit-card-results.js';
import { CARD_FIELD_IDS } from '../components/credit-card-form.js';

mountCalculator({
  defaults: CARD_DEFAULTS,
  fieldIds: CARD_FIELD_IDS,
  run: runCardCalculator,
  render: creditCardResults,
  quick: creditCardQuickResult,
  announce: creditCardAnnouncement
});
