/**
 * Browser entry for the Dividend Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runDividendCalculator, DIVIDEND_DEFAULTS } from '../adapters/dividend.js';
import { dividendResults, dividendQuickResult, dividendAnnouncement } from '../components/dividend-results.js';
import { DIVIDEND_FIELD_IDS } from '../components/dividend-form.js';

mountCalculator({
  defaults: DIVIDEND_DEFAULTS,
  fieldIds: DIVIDEND_FIELD_IDS,
  run: runDividendCalculator,
  render: dividendResults,
  quick: dividendQuickResult,
  announce: dividendAnnouncement
});
