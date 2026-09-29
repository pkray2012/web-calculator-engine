/**
 * Adapter between the Personal Loan Calculator page and the personal-loan
 * engine. Parses raw form values, calls calculatePersonalLoan(), and shapes
 * the result for display. No financial formulas live here.
 */

import { calculatePersonalLoan } from '../calculators/personal-loan.js';
import { numberField, monthField, termField } from '../lib/validation.js';
import { amortizedView } from './amortized-view.js';

export const PERSONAL_LIMITS = Object.freeze({
  maxAmount: 10_000_000,
  maxFeeRate: 50,
  maxRate: 100,
  maxTermMonths: 360
});

/** Illustrative example values; the page labels them as an example, not market data. */
export const PERSONAL_DEFAULTS = Object.freeze({
  loanAmount: '15000',
  originationFeeRate: '5',
  annualRate: '12',
  termValue: '3',
  termUnit: 'years',
  extraMonthly: '0',
  startMonth: ''
});

/** Common personal-loan terms shown in the comparison, in months. */
export const PERSONAL_COMPARISON_TERMS = Object.freeze([12, 24, 36, 48, 60, 72, 84]);

export function parsePersonalForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };

  const loanAmount = take('loanAmount', numberField(values.loanAmount, {
    label: 'Loan amount', min: 0, minExclusive: true, max: PERSONAL_LIMITS.maxAmount
  }));
  const originationFeeRate = take('originationFeeRate', numberField(values.originationFeeRate, {
    label: 'Origination fee', required: false, fallback: 0, min: 0, max: PERSONAL_LIMITS.maxFeeRate
  }));
  const annualRate = take('annualRate', numberField(values.annualRate, {
    label: 'Interest rate', min: 0, max: PERSONAL_LIMITS.maxRate
  }));
  const termMonths = take('termValue', termField(values.termValue, values.termUnit, { maxMonths: PERSONAL_LIMITS.maxTermMonths }));
  const extraMonthly = take('extraMonthly', numberField(values.extraMonthly, {
    label: 'Extra monthly payment', required: false, fallback: 0, min: 0, max: PERSONAL_LIMITS.maxAmount
  }));
  const startMonth = take('startMonth', monthField(values.startMonth, { label: 'First payment month' }));

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { loanAmount, originationFeeRate, annualRate, termMonths, extraMonthly, startMonth } };
}

function comparisonTerms(selected) {
  return [...new Set([...PERSONAL_COMPARISON_TERMS, selected])].sort((a, b) => a - b);
}

export function buildPersonalView(input) {
  const { loanAmount, originationFeeRate, annualRate, termMonths, extraMonthly, startMonth } = input;
  const loan = calculatePersonalLoan({ loanAmount, originationFeeRate, annualRate, termMonths, extraMonthly });

  const termComparison = comparisonTerms(termMonths).map((term) => {
    const result = term === termMonths ? loan : calculatePersonalLoan({ loanAmount, originationFeeRate, annualRate, termMonths: term });
    return {
      termMonths: term,
      monthlyPayment: result.monthlyPayment,
      totalInterest: result.totalInterest,
      effectiveAPR: result.effectiveAPR,
      selected: term === termMonths
    };
  });

  const view = amortizedView({
    loan,
    input: { principal: loanAmount, annualRate, termMonths, extraMonthly, startMonth },
    termComparison
  });

  return {
    ...view,
    fee: {
      rate: loan.originationFeeRate,
      amount: loan.originationFee,
      amountReceived: loan.amountReceived,
      effectiveAPR: loan.effectiveAPR,
      costOfBorrowing: loan.costOfBorrowing,
      totalRepaid: loan.totalCost,
      withExtra: view.extra ? {
        effectiveAPR: loan.accelerated.effectiveAPR,
        costOfBorrowing: loan.accelerated.costOfBorrowing
      } : null
    }
  };
}

/**
 * Parse, validate and calculate in one step. Engine range errors become
 * field errors instead of exceptions.
 */
export function runPersonalCalculator(values) {
  const parsed = parsePersonalForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildPersonalView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    if (/originationFeeRate|amount received|netProceeds/.test(error.message)) {
      return { ok: false, errors: { originationFeeRate: 'The fee leaves no money to receive. Enter a smaller origination fee.' } };
    }
    return {
      ok: false,
      errors: { annualRate: 'This rate and term are too extreme to calculate. Try a lower rate or a shorter term.' }
    };
  }
}
