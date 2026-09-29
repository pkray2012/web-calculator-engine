/**
 * Adapter between the Overtime Calculator page and its engine. Parses raw form
 * values, calls weeklyOvertime() and shapes the result for display. No
 * formulas live here.
 */

import { weeklyOvertime } from '../calculators/overtime.js';
import { numberField } from '../lib/validation.js';

export const DAY_NAMES = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
export const DAY_FIELDS = Object.freeze(DAY_NAMES.map((name) => `hours${name.slice(0, 3)}`));

/** Illustrative example: five 9-hour days at $22 an hour. */
export const OVERTIME_DEFAULTS = Object.freeze({
  hourlyRate: '22',
  rule: 'federal',
  overtimeMultiplier: '1.5',
  hoursMon: '9', hoursTue: '9', hoursWed: '9', hoursThu: '9', hoursFri: '9', hoursSat: '', hoursSun: '',
  weeks: '1'
});

export function parseOvertimeForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const rule = values.rule === 'california' ? 'california' : 'federal';
  const hourlyRate = take('hourlyRate', numberField(values.hourlyRate, { label: 'Hourly rate', min: 0, minExclusive: true, max: 10_000 }));
  const hours = DAY_FIELDS.map((field, i) => take(field, numberField(values[field], { label: `${DAY_NAMES[i]} hours`, required: false, fallback: 0, min: 0, max: 24 })));
  const overtimeMultiplier = rule === 'federal'
    ? take('overtimeMultiplier', numberField(values.overtimeMultiplier, { label: 'Overtime rate', required: false, fallback: 1.5, min: 1.5, max: 3 }))
    : 1.5;
  const weeks = take('weeks', numberField(values.weeks, { label: 'Weeks like this', required: false, fallback: 1, min: 1, max: 52, integer: true }));
  if (!errors[DAY_FIELDS[0]] && hours.every((h) => h === 0) && !DAY_FIELDS.some((f) => errors[f])) errors[DAY_FIELDS[0]] = 'Enter the hours worked on at least one day.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { hourlyRate, rule, overtimeMultiplier, hours, weeks } };
}

export function buildOvertimeView(input) {
  const { weeks, ...rest } = input;
  const result = weeklyOvertime(rest);
  return { input, ...result, periodPay: result.totalPay * weeks, periodPremium: result.overtimePremium * weeks };
}

/** Parse, validate and calculate. */
export function runOvertimeCalculator(values) {
  const parsed = parseOvertimeForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildOvertimeView(parsed.input) };
}
