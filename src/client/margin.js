/**
 * Browser entry for the Profit Margin Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runMarginCalculator, MARGIN_DEFAULTS } from '../adapters/margin.js';
import { marginResults, marginQuickResult, marginAnnouncement } from '../components/margin-results.js';
import { MARGIN_FIELD_IDS } from '../components/margin-form.js';

mountCalculator({
  defaults: MARGIN_DEFAULTS,
  fieldIds: MARGIN_FIELD_IDS,
  run: runMarginCalculator,
  render: marginResults,
  quick: marginQuickResult,
  announce: marginAnnouncement
});
