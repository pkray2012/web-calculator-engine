/**
 * Adapter between the Loan Payment Calculator page and the pure loan engine.
 * Parses raw form values, calls src/calculators/loan-payment.js, and shapes
 * the result for display. No financial formulas live here.
 */

import { calculateLoan } from '../calculators/loan-payment.js';
import { numberField, monthField, termField } from '../lib/validation.js';
import { amortizedView } from './amortized-view.js';

export { summarizeByYear } from './amortized-view.js';

export const LOAN_LIMITS = Object.freeze({
  maxPrincipal: 100_000_000,
  maxRate: 100,
  maxTermMonths: 600
});

export const LOAN_DEFAULTS = Object.freeze({
  principal: '25000',
  annualRate: '8',
  termValue: '5',
  termUnit: 'years',
  extraMonthly: '0',
  startMonth: ''
});

/** Common terms offered for side-by-side comparison, in months. */
const COMPARISON_TERMS = [12, 24, 36, 48, 60, 72, 84, 120, 180, 240, 300, 360];

/**
 * Validate raw form values (strings) into engine input.
 * Returns { ok: true, input } or { ok: false, errors: { field: message } }.
 */
export function parseLoanForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };

  const principal = take('principal', numberField(values.principal, {
    label: 'Loan amount', min: 0, minExclusive: true, max: LOAN_LIMITS.maxPrincipal
  }));
  const annualRate = take('annualRate', numberField(values.annualRate, {
    label: 'Interest rate', min: 0, max: LOAN_LIMITS.maxRate
  }));
  const termMonths = take('termValue', termField(values.termValue, values.termUnit, { maxMonths: LOAN_LIMITS.maxTermMonths }));
  const extraMonthly = take('extraMonthly', numberField(values.extraMonthly, {
    label: 'Extra monthly payment', required: false, fallback: 0, min: 0, max: LOAN_LIMITS.maxPrincipal
  }));
  const startMonth = take('startMonth', monthField(values.startMonth, { label: 'First payment month' }));

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { principal, annualRate, termMonths, extraMonthly, startMonth } };
}

function comparisonTerms(selected) {
  const below = COMPARISON_TERMS.filter((term) => term < selected).slice(-2);
  const above = COMPARISON_TERMS.filter((term) => term > selected).slice(0, 2);
  return [...below, selected, ...above];
}

/**
 * Run the engine and build everything the results UI needs.
 * input comes from parseLoanForm().
 */
export function buildLoanView(input) {
  const { principal, annualRate, termMonths, extraMonthly = 0 } = input;
  const loan = calculateLoan({ principal, annualRate, termMonths, extraMonthly });
  return amortizedView({
    loan,
    input,
    termComparison: comparisonTerms(termMonths).map((term) => {
      const result = term === termMonths ? loan : calculateLoan({ principal, annualRate, termMonths: term });
      return {
        termMonths: term,
        monthlyPayment: result.monthlyPayment,
        totalInterest: result.totalInterest,
        selected: term === termMonths
      };
    })
  });
}

/**
 * Parse, validate and calculate in one step. Engine range errors (for
 * example a rate/term so extreme the payment cannot reduce the balance at
 * floating-point precision) become field errors instead of exceptions.
 */
export function runLoanCalculator(values) {
  const parsed = parseLoanForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildLoanView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return {
      ok: false,
      errors: { annualRate: 'This rate and term are too extreme to calculate. Try a lower rate or a shorter term.' }
    };
  }
}
