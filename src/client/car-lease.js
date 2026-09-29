/**
 * Browser entry for the Car Lease Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runLeaseCalculator, LEASE_DEFAULTS } from '../adapters/car-lease.js';
import { carLeaseResults, carLeaseQuickResult, carLeaseAnnouncement } from '../components/car-lease-results.js';
import { LEASE_FIELD_IDS } from '../components/car-lease-form.js';

mountCalculator({
  defaults: LEASE_DEFAULTS,
  fieldIds: LEASE_FIELD_IDS,
  run: runLeaseCalculator,
  render: carLeaseResults,
  quick: carLeaseQuickResult,
  announce: carLeaseAnnouncement
});
