/**
 * Browser entry for the Mortgage Payment Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runMortgageCalculator, MORTGAGE_DEFAULTS } from '../adapters/mortgage-payment.js';
import { mortgagePaymentResults, mortgageQuickResult, mortgageAnnouncement } from '../components/mortgage-payment-results.js';
import { MORTGAGE_FIELD_IDS } from '../components/mortgage-payment-form.js';

mountCalculator({
  defaults: MORTGAGE_DEFAULTS,
  fieldIds: MORTGAGE_FIELD_IDS,
  run: runMortgageCalculator,
  render: mortgagePaymentResults,
  quick: mortgageQuickResult,
  announce: mortgageAnnouncement
});
