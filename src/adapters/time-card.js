/**
 * Adapter between the Time Card Calculator page and its engine. Parses raw
 * form values, calls calculateTimeCard() and shapes the result for display.
 * No formulas live here.
 */

import { calculateTimeCard } from '../calculators/time-card.js';
import { numberField } from '../lib/validation.js';

export const TIME_CARD_DAYS = Object.freeze([
  { key: 'mon', name: 'Monday' },
  { key: 'tue', name: 'Tuesday' },
  { key: 'wed', name: 'Wednesday' },
  { key: 'thu', name: 'Thursday' },
  { key: 'fri', name: 'Friday' },
  { key: 'sat', name: 'Saturday' },
  { key: 'sun', name: 'Sunday' }
]);

const weekday = (start, end, breakMinutes) => ({ start, end, break: breakMinutes });
const off = weekday('', '', '');

/** Illustrative week: 8:00 to 5:30 with a 30-minute lunch, Monday to Friday, at $20 an hour. */
export const TIME_CARD_DEFAULTS = Object.freeze({
  ...Object.fromEntries(TIME_CARD_DAYS.flatMap(({ key }, index) => {
    const day = index < 5 ? weekday('08:00', '17:30', '30') : off;
    return [[`${key}Start`, day.start], [`${key}End`, day.end], [`${key}Break`, day.break]];
  })),
  hourlyRate: '20',
  overtimeAfterHours: '40',
  overtimeMultiplier: '1.5'
});

/** "HH:MM" (24-hour, as <input type="time"> submits) → minutes after midnight. */
export function parseTime(raw, label) {
  const text = String(raw ?? '').trim();
  if (text === '') return { value: null };
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return { error: `${label} must be a time like 08:30.` };
  return { value: Number(match[1]) * 60 + Number(match[2]) };
}

export function parseTimeCardForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const days = TIME_CARD_DAYS.map(({ key, name }) => {
    const start = take(`${key}Start`, parseTime(values[`${key}Start`], `${name} start`));
    const end = take(`${key}End`, parseTime(values[`${key}End`], `${name} end`));
    const breakMinutes = take(`${key}Break`, numberField(values[`${key}Break`], { label: `${name} break`, required: false, fallback: 0, min: 0, max: 720, integer: true }));
    if (errors[`${key}Start`] || errors[`${key}End`] || errors[`${key}Break`]) return null;
    if (start === null && end === null) {
      if (breakMinutes > 0) errors[`${key}Start`] = `Enter ${name}'s start and end times, or clear the break.`;
      return null;
    }
    if (start === null) { errors[`${key}Start`] = `${name} start is required when an end time is entered.`; return null; }
    if (end === null) { errors[`${key}End`] = `${name} end is required when a start time is entered.`; return null; }
    const span = end > start ? end - start : end + 1440 - start;
    if (breakMinutes >= span) { errors[`${key}Break`] = `${name} break must be shorter than the shift.`; return null; }
    return { start, end, breakMinutes };
  });
  const hourlyRate = take('hourlyRate', numberField(values.hourlyRate, { label: 'Hourly rate', required: false, fallback: 0, min: 0, max: 10_000 }));
  const overtimeAfterHours = take('overtimeAfterHours', numberField(values.overtimeAfterHours, { label: 'Overtime after', required: false, fallback: 40, min: 0, max: 168 }));
  const overtimeMultiplier = take('overtimeMultiplier', numberField(values.overtimeMultiplier, { label: 'Overtime pay rate', required: false, fallback: 1.5, min: 1, max: 5 }));
  if (!Object.keys(errors).length && !days.some(Boolean)) errors.monStart = 'Enter a start and end time for at least one day.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { days, hourlyRate, overtimeAfterHours, overtimeMultiplier } };
}

export function buildTimeCardView(input) {
  return { input, ...calculateTimeCard(input) };
}

/** Parse, validate and calculate. */
export function runTimeCardCalculator(values) {
  const parsed = parseTimeCardForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildTimeCardView(parsed.input) };
}
