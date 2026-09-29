/**
 * Browser entry for the Hourly to Salary Calculator.
 */

import { mountCalculator } from './calculator.js';
import { runHourlySalaryCalculator, HOURLY_SALARY_DEFAULTS } from '../adapters/hourly-salary.js';
import { hourlySalaryResults, hourlySalaryQuickResult, hourlySalaryAnnouncement } from '../components/hourly-salary-results.js';
import { HOURLY_SALARY_FIELD_IDS } from '../components/hourly-salary-form.js';

mountCalculator({
  defaults: HOURLY_SALARY_DEFAULTS,
  fieldIds: HOURLY_SALARY_FIELD_IDS,
  run: runHourlySalaryCalculator,
  render: hourlySalaryResults,
  quick: hourlySalaryQuickResult,
  announce: hourlySalaryAnnouncement
});
