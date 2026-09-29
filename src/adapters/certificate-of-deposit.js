/**
 * Adapter between the CD Calculator page and its engine. Parses raw form
 * values, calls calculateCd() and shapes the result for display. No formulas
 * live here.
 */

import { calculateCd, COMPOUNDING } from '../calculators/certificate-of-deposit.js';
import { numberField, monthField, termField } from '../lib/validation.js';
import { paymentMonth } from '../lib/format.js';

export const CD_LIMITS = Object.freeze({ maxDeposit: 100_000_000, maxRate: 25, maxTermMonths: 240, maxPenaltyMonths: 60 });

/** Illustrative example values, not a quote. */
export const CD_DEFAULTS = Object.freeze({
  deposit: '10000',
  ratePercent: '4.00',
  rateType: 'apy',
  compounding: 'daily',
  termValue: '18',
  termUnit: 'months',
  openMonth: '',
  taxPercent: '',
  penaltyMonths: '6',
  withdrawMonth: ''
});

export function parseCdForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const deposit = take('deposit', numberField(values.deposit, { label: 'Deposit', min: 0, minExclusive: true, max: CD_LIMITS.maxDeposit }));
  const ratePercent = take('ratePercent', numberField(values.ratePercent, { label: 'Rate', min: 0, max: CD_LIMITS.maxRate }));
  const rateType = values.rateType === 'apr' ? 'apr' : 'apy';
  const compounding = Object.hasOwn(COMPOUNDING, values.compounding) ? values.compounding : 'daily';
  const termMonths = take('termValue', termField(values.termValue, values.termUnit, { label: 'CD term', maxMonths: CD_LIMITS.maxTermMonths }));
  const openMonth = take('openMonth', monthField(values.openMonth, { label: 'Opening month' }));
  const taxPercent = take('taxPercent', numberField(values.taxPercent, { label: 'Tax rate on interest', required: false, fallback: 0, min: 0, max: 60 }));
  const penaltyMonths = take('penaltyMonths', numberField(values.penaltyMonths, { label: 'Early-withdrawal penalty', required: false, fallback: 0, min: 0, max: CD_LIMITS.maxPenaltyMonths }));
  const withdrawMonth = take('withdrawMonth', numberField(values.withdrawMonth, { label: 'Months before cashing in', required: false, fallback: null, min: 1, integer: true, max: CD_LIMITS.maxTermMonths }));
  if (!errors.termValue && !errors.withdrawMonth && withdrawMonth !== null && withdrawMonth >= termMonths) {
    errors.withdrawMonth = 'Cashing in early must be before the CD matures. Leave it blank to see the full term.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { deposit, ratePercent, rateType, compounding, termMonths, openMonth, taxPercent, penaltyMonths, withdrawMonth } };
}

export function buildCdView(input) {
  const { openMonth, ...engineInput } = input;
  const result = calculateCd(engineInput);
  // The CD matures the same month, termMonths later: paymentMonth counts the opening month as month 1.
  const maturityMonth = openMonth ? paymentMonth(openMonth, input.termMonths + 1) : null;
  return { input, ...result, maturityMonth };
}

/** Parse, validate and calculate. */
export function runCdCalculator(values) {
  const parsed = parseCdForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildCdView(parsed.input) };
}
