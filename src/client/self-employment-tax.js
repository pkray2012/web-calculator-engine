/**
 * Browser entry for the Self-Employment Tax Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runSelfEmploymentTaxCalculator, SE_TAX_DEFAULTS } from '../adapters/self-employment-tax.js';
import { selfEmploymentTaxResults, selfEmploymentTaxQuickResult, selfEmploymentTaxAnnouncement } from '../components/self-employment-tax-results.js';
import { SE_TAX_FIELD_IDS } from '../components/self-employment-tax-form.js';

mountCalculator({
  defaults: SE_TAX_DEFAULTS,
  fieldIds: SE_TAX_FIELD_IDS,
  run: runSelfEmploymentTaxCalculator,
  render: selfEmploymentTaxResults,
  quick: selfEmploymentTaxQuickResult,
  announce: selfEmploymentTaxAnnouncement
});
