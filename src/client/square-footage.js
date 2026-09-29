/**
 * Browser entry for the Square Footage Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runSquareFootageCalculator, SQFT_DEFAULTS } from '../adapters/square-footage.js';
import { squareFootageResults, squareFootageQuickResult, squareFootageAnnouncement } from '../components/square-footage-results.js';
import { SQFT_FIELD_IDS } from '../components/square-footage-form.js';

mountCalculator({
  defaults: SQFT_DEFAULTS,
  fieldIds: SQFT_FIELD_IDS,
  run: runSquareFootageCalculator,
  render: squareFootageResults,
  quick: squareFootageQuickResult,
  announce: squareFootageAnnouncement
});
