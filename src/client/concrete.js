/**
 * Browser entry for the Concrete Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runConcreteCalculator, CONCRETE_DEFAULTS } from '../adapters/concrete.js';
import { concreteResults, concreteQuickResult, concreteAnnouncement } from '../components/concrete-results.js';
import { CONCRETE_FIELD_IDS } from '../components/concrete-form.js';

mountCalculator({
  defaults: CONCRETE_DEFAULTS,
  fieldIds: CONCRETE_FIELD_IDS,
  run: runConcreteCalculator,
  render: concreteResults,
  quick: concreteQuickResult,
  announce: concreteAnnouncement
});
