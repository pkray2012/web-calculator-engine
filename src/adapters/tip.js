/**
 * Adapter between the Tip Calculator page and its engine. Parses raw form
 * values, calls calculateTip() and shapes the result for display. No
 * formulas live here.
 */

import { calculateTip } from '../calculators/tip.js';
import { numberField } from '../lib/validation.js';

/** Illustrative example values: an $86.40 bill, 20% tip, split three ways. */
export const TIP_DEFAULTS = Object.freeze({
  bill: '86.40',
  tipPercent: '20',
  people: '3',
  tax: '',
  tipOnPreTax: '',
  roundUp: ''
});

export function parseTipForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const bill = take('bill', numberField(values.bill, { label: 'Bill', min: 0, minExclusive: true, max: 1_000_000 }));
  const tipPercent = take('tipPercent', numberField(values.tipPercent, { label: 'Tip', min: 0, max: 100 }));
  const people = take('people', numberField(values.people, { label: 'People', required: false, fallback: 1, min: 1, max: 100, integer: true }));
  const tax = take('tax', numberField(values.tax, { label: 'Tax on the bill', required: false, fallback: 0, min: 0, max: 1_000_000 }));
  if (!errors.bill && !errors.tax && tax > bill) errors.tax = 'Tax on the bill cannot be more than the bill.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { bill, tipPercent, people, tax, tipOnPreTax: values.tipOnPreTax === 'on' && tax > 0, roundUp: values.roundUp === 'on' } };
}

export function buildTipView(input) {
  return { input, ...calculateTip(input) };
}

/** Parse, validate and calculate. */
export function runTipCalculator(values) {
  const parsed = parseTipForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildTipView(parsed.input) };
}
