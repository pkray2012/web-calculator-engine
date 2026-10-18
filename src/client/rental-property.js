/**
 * Browser entry for the Rental Property Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runRentalCalculator, RENTAL_DEFAULTS } from '../adapters/rental-property.js';
import { rentalResults, rentalQuickResult, rentalAnnouncement } from '../components/rental-property-results.js';
import { RENTAL_FIELD_IDS } from '../components/rental-property-form.js';

mountCalculator({
  defaults: RENTAL_DEFAULTS,
  fieldIds: RENTAL_FIELD_IDS,
  run: runRentalCalculator,
  render: rentalResults,
  quick: rentalQuickResult,
  announce: rentalAnnouncement
});
