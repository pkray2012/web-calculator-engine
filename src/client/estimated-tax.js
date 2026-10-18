/**
 * Browser entry for the Estimated Tax Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runEstimatedTaxCalculator, ESTIMATED_TAX_DEFAULTS } from '../adapters/estimated-tax.js';
import { estimatedTaxResults, estimatedTaxQuickResult, estimatedTaxAnnouncement } from '../components/estimated-tax-results.js';
import { ESTIMATED_TAX_FIELD_IDS } from '../components/estimated-tax-form.js';

mountCalculator({
  defaults: ESTIMATED_TAX_DEFAULTS,
  fieldIds: ESTIMATED_TAX_FIELD_IDS,
  run: runEstimatedTaxCalculator,
  render: estimatedTaxResults,
  quick: estimatedTaxQuickResult,
  announce: estimatedTaxAnnouncement
});
