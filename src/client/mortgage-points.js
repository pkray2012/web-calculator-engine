/**
 * Browser entry for the Mortgage Points Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runPointsCalculator, POINTS_DEFAULTS } from '../adapters/mortgage-points.js';
import { mortgagePointsResults, mortgagePointsQuickResult, mortgagePointsAnnouncement } from '../components/mortgage-points-results.js';
import { POINTS_FIELD_IDS } from '../components/mortgage-points-form.js';

mountCalculator({
  defaults: POINTS_DEFAULTS,
  fieldIds: POINTS_FIELD_IDS,
  run: runPointsCalculator,
  render: mortgagePointsResults,
  quick: mortgagePointsQuickResult,
  announce: mortgagePointsAnnouncement
});
