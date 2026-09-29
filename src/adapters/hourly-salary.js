/**
 * Adapter between the Hourly to Salary Calculator page and its engine. Parses
 * raw form values, calls convertPay() and shapes the result for display.
 * No formulas live here.
 */

import { convertPay, PAY_PERIODS } from '../calculators/hourly-salary.js';
import { numberField } from '../lib/validation.js';

/** Illustrative: $25 an hour, 40 hours a week, 52 paid weeks. */
export const HOURLY_SALARY_DEFAULTS = Object.freeze({
  amount: '25',
  period: 'hour',
  hoursPerWeek: '40',
  daysPerWeek: '5',
  weeksPerYear: '52',
  overtimeHours: '',
  overtimeMultiplier: '1.5',
  paidDaysOff: ''
});

export function parseHourlySalaryForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const period = Object.hasOwn(PAY_PERIODS, values.period) ? values.period : 'hour';
  const amount = take('amount', numberField(values.amount, { label: 'Pay', min: 0, minExclusive: true, max: 100_000_000 }));
  const hoursPerWeek = take('hoursPerWeek', numberField(values.hoursPerWeek, { label: 'Hours a week', required: false, fallback: 40, min: 0, minExclusive: true, max: 168 }));
  const daysPerWeek = take('daysPerWeek', numberField(values.daysPerWeek, { label: 'Days a week', required: false, fallback: 5, min: 1, max: 7 }));
  const weeksPerYear = take('weeksPerYear', numberField(values.weeksPerYear, { label: 'Paid weeks a year', required: false, fallback: 52, min: 1, max: 52 }));
  const overtimeHours = take('overtimeHours', numberField(values.overtimeHours, { label: 'Overtime hours', required: false, fallback: 0, min: 0, max: 128 }));
  const overtimeMultiplier = take('overtimeMultiplier', numberField(values.overtimeMultiplier, { label: 'Overtime pay rate', required: false, fallback: 1.5, min: 1, max: 5 }));
  const paidDaysOff = take('paidDaysOff', numberField(values.paidDaysOff, { label: 'Paid days off', required: false, fallback: 0, min: 0, max: 365 }));
  if (!errors.hoursPerWeek && !errors.overtimeHours && hoursPerWeek + overtimeHours > 168) {
    errors.overtimeHours = 'Regular and overtime hours together cannot be more than 168 a week.';
  }
  if (!errors.paidDaysOff && !errors.daysPerWeek && !errors.weeksPerYear && paidDaysOff >= daysPerWeek * weeksPerYear) {
    errors.paidDaysOff = 'Paid days off must be fewer than the days you work in a year.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { amount, period, hoursPerWeek, daysPerWeek, weeksPerYear, overtimeHours, overtimeMultiplier, paidDaysOff } };
}

export function buildHourlySalaryView(input) {
  return { input, ...convertPay(input) };
}

/** Parse, validate and calculate. */
export function runHourlySalaryCalculator(values) {
  const parsed = parseHourlySalaryForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildHourlySalaryView(parsed.input) };
}
