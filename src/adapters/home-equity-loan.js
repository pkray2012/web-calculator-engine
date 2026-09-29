/**
 * Adapter between the Home Equity Loan Calculator page and its engine.
 * Parses raw form values, calls calculateHomeEquityLoan() and shapes the
 * result for display. No financial formulas live here.
 */

import { calculateHomeEquityLoan } from '../calculators/home-equity-loan.js';
import { numberField, monthField, termField } from '../lib/validation.js';
import { amortizedView } from './amortized-view.js';

export const HEL_LIMITS = Object.freeze({ maxAmount: 10_000_000, maxRate: 30, maxTermMonths: 360 });

/** Illustrative example values; the page labels them as an example, not market rates. */
export const HEL_DEFAULTS = Object.freeze({
  homeValue: '400000',
  mortgageBalance: '240000',
  otherLiens: '',
  loanAmount: '50000',
  closingCosts: '1500',
  financeClosingCosts: '',
  annualRate: '8.25',
  termValue: '15',
  termUnit: 'years',
  extraMonthly: '0',
  startMonth: ''
});

/** Common home equity loan terms shown in the comparison, in months. */
export const HEL_COMPARISON_TERMS = Object.freeze([60, 120, 180, 240, 360]);

export function parseHelForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, extra = {}) => take(field, numberField(values[field], { label, min: 0, max: HEL_LIMITS.maxAmount, ...extra }));
  const homeValue = money('homeValue', 'Home value', { minExclusive: true });
  const mortgageBalance = money('mortgageBalance', 'Mortgage balance');
  const otherLiens = money('otherLiens', 'Other home loans', { required: false, fallback: 0 });
  const loanAmount = money('loanAmount', 'Loan amount', { minExclusive: true });
  const closingCosts = money('closingCosts', 'Closing costs', { required: false, fallback: 0 });
  const annualRate = take('annualRate', numberField(values.annualRate, { label: 'Interest rate', min: 0, max: HEL_LIMITS.maxRate }));
  const termMonths = take('termValue', termField(values.termValue, values.termUnit, { maxMonths: HEL_LIMITS.maxTermMonths }));
  const extraMonthly = money('extraMonthly', 'Extra monthly payment', { required: false, fallback: 0 });
  const startMonth = take('startMonth', monthField(values.startMonth, { label: 'First payment month' }));
  const financeClosingCosts = values.financeClosingCosts === 'on' || values.financeClosingCosts === 'true';
  if (errors.closingCosts === undefined && errors.loanAmount === undefined && !financeClosingCosts && closingCosts >= loanAmount) {
    errors.closingCosts = 'Closing costs paid from the loan must be less than the loan amount.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { homeValue, mortgageBalance, otherLiens, loanAmount, closingCosts, financeClosingCosts, annualRate, termMonths, extraMonthly, startMonth } };
}

function comparisonTerms(selected) {
  return [...new Set([...HEL_COMPARISON_TERMS, selected])].sort((a, b) => a - b);
}

export function buildHelView(input) {
  const run = (termMonths, extraMonthly = 0) => calculateHomeEquityLoan({ ...input, termMonths, extraMonthly });
  const result = run(input.termMonths, input.extraMonthly);
  const termComparison = comparisonTerms(input.termMonths).map((term) => {
    const option = term === input.termMonths ? result : run(term);
    return { termMonths: term, monthlyPayment: option.monthlyPayment, totalInterest: option.totalInterest, selected: term === input.termMonths };
  });
  const view = amortizedView({
    loan: result,
    input: { principal: result.principal, annualRate: input.annualRate, termMonths: input.termMonths, extraMonthly: input.extraMonthly, startMonth: input.startMonth },
    termComparison
  });
  return {
    ...view,
    home: {
      value: input.homeValue,
      existingDebt: result.existingDebt,
      equity: result.equity,
      currentCltv: result.currentCltv,
      newCltv: result.newCltv,
      limits: result.limits,
      loanAmount: input.loanAmount,
      closingCosts: input.closingCosts,
      financeClosingCosts: input.financeClosingCosts,
      cashReceived: result.cashReceived,
      costOfBorrowing: result.costOfBorrowing
    }
  };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runHelCalculator(values) {
  const parsed = parseHelForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildHelView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { annualRate: 'These numbers are too extreme to calculate. Check the rate and term.' } };
  }
}
