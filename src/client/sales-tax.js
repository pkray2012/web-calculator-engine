/**
 * Browser entry for the Sales Tax Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runSalesTaxCalculator, SALES_TAX_DEFAULTS } from '../adapters/sales-tax.js';
import { salesTaxResults, salesTaxQuickResult, salesTaxAnnouncement } from '../components/sales-tax-results.js';
import { SALES_TAX_FIELD_IDS } from '../components/sales-tax-form.js';

mountCalculator({
  defaults: SALES_TAX_DEFAULTS,
  fieldIds: SALES_TAX_FIELD_IDS,
  run: runSalesTaxCalculator,
  render: salesTaxResults,
  quick: salesTaxQuickResult,
  announce: salesTaxAnnouncement
});
