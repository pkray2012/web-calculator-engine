/**
 * Adapter between the Percentage Calculator page and its engine. Parses raw
 * form values, calls the engine for the selected mode and shapes the result
 * for display. No formulas live here.
 */

import { percentOf, whatPercent, percentChange, percentOff } from '../calculators/percentage.js';
import { numberField } from '../lib/validation.js';

const MODES = ['of', 'is', 'change', 'off'];
const BIG = 1e15;

/** Illustrative example values for each mode. */
export const PERCENT_DEFAULTS = Object.freeze({
  mode: 'of',
  ofPercent: '15',
  ofValue: '80',
  isPart: '18',
  isWhole: '75',
  changeFrom: '40',
  changeTo: '50',
  offPrice: '120',
  offPercent: '25',
  offExtra: ''
});

export function parsePercentForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const num = (field, label, extra = {}) => take(field, numberField(values[field], { label, min: -BIG, max: BIG, ...extra }));
  const mode = MODES.includes(values.mode) ? values.mode : 'of';
  let input;
  if (mode === 'of') input = { mode, percent: num('ofPercent', 'Percent'), of: num('ofValue', 'Number') };
  else if (mode === 'is') {
    input = { mode, part: num('isPart', 'Part'), whole: num('isWhole', 'Whole') };
    if (!errors.isWhole && input.whole === 0) errors.isWhole = 'Whole cannot be 0.';
  } else if (mode === 'change') {
    input = { mode, from: num('changeFrom', 'Starting value'), to: num('changeTo', 'New value') };
    if (!errors.changeFrom && input.from === 0) errors.changeFrom = 'Starting value cannot be 0: a change from zero has no percentage.';
  } else {
    input = {
      mode,
      price: num('offPrice', 'Original price', { min: 0 }),
      percent: num('offPercent', 'Discount', { min: 0, max: 100 }),
      extraPercent: take('offExtra', numberField(values.offExtra, { label: 'Extra discount', required: false, fallback: 0, min: 0, max: 100 }))
    };
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input };
}

export function buildPercentView(input) {
  if (input.mode === 'of') return { input, result: percentOf(input) };
  if (input.mode === 'is') return { input, result: whatPercent(input) };
  if (input.mode === 'change') return { input, result: percentChange(input) };
  return { input, result: percentOff(input) };
}

/** Parse, validate and calculate. */
export function runPercentCalculator(values) {
  const parsed = parsePercentForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildPercentView(parsed.input) };
}
