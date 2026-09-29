/**
 * Adapter between the Student Loan Refinance Calculator page and its engine.
 * Parses raw form values, calls calculateStudentLoanRefinance() and shapes the
 * result for display. No financial formulas live here.
 */

import { calculateStudentLoanRefinance } from '../calculators/student-loan-refinance.js';
import { numberField, termField } from '../lib/validation.js';

export const SLR_LIMITS = Object.freeze({ maxBalance: 2_000_000, maxRate: 30, maxTermMonths: 360, maxFees: 50_000 });

/** Illustrative example values; the page labels them as an example, not market rates. */
export const SLR_DEFAULTS = Object.freeze({
  loanType: 'federal',
  balance: '35000',
  currentRate: '6.8',
  currentTermValue: '10',
  currentTermUnit: 'years',
  newRate: '5.5',
  newTermValue: '10',
  newTermUnit: 'years',
  fees: ''
});

export function parseSlrForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const balance = take('balance', numberField(values.balance, { label: 'Loan balance', min: 0, minExclusive: true, max: SLR_LIMITS.maxBalance }));
  const currentRate = take('currentRate', numberField(values.currentRate, { label: 'Current interest rate', min: 0, max: SLR_LIMITS.maxRate }));
  const currentTermMonths = take('currentTermValue', termField(values.currentTermValue, values.currentTermUnit, { label: 'Time left on your loans', maxMonths: SLR_LIMITS.maxTermMonths }));
  const newRate = take('newRate', numberField(values.newRate, { label: 'New interest rate', min: 0, max: SLR_LIMITS.maxRate }));
  const newTermMonths = take('newTermValue', termField(values.newTermValue, values.newTermUnit, { label: 'New loan term', maxMonths: SLR_LIMITS.maxTermMonths }));
  const fees = take('fees', numberField(values.fees, { label: 'Fees', required: false, fallback: 0, min: 0, max: SLR_LIMITS.maxFees }));
  const federal = values.loanType !== 'private';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { federal, balance, currentRate, currentTermMonths, newRate, newTermMonths, fees } };
}

export function buildSlrView(input) {
  const result = calculateStudentLoanRefinance(input);
  return { input, ...result };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runSlrCalculator(values) {
  const parsed = parseSlrForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildSlrView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { newRate: 'These numbers are too extreme to calculate. Check the rates and terms.' } };
  }
}
