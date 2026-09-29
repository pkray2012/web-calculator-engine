/**
 * Browser entry for the Rent vs. Buy Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runRentVsBuyCalculator, RVB_DEFAULTS } from '../adapters/rent-vs-buy.js';
import { rentVsBuyResults, rentVsBuyQuickResult, rentVsBuyAnnouncement } from '../components/rent-vs-buy-results.js';
import { RVB_FIELD_IDS } from '../components/rent-vs-buy-form.js';

mountCalculator({
  defaults: RVB_DEFAULTS,
  fieldIds: RVB_FIELD_IDS,
  run: runRentVsBuyCalculator,
  render: rentVsBuyResults,
  quick: rentVsBuyQuickResult,
  announce: rentVsBuyAnnouncement
});
