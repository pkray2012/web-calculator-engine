/**
 * Adapter between the Mortgage Refinance Calculator page and the refinance
 * engine. Parses raw form values, calls calculateMortgageRefinance(), and
 * shapes the result for display. No financial formulas live here.
 */

import { calculateMortgageRefinance } from '../calculators/mortgage-refinance.js';
import { numberField, termField } from '../lib/validation.js';

export const REFI_LIMITS = Object.freeze({
  maxBalance: 10_000_000,
  maxRate: 30,
  maxTermMonths: 480
});

/** Illustrative example values; the page labels them as an example, not market rates. */
export const REFI_DEFAULTS = Object.freeze({
  currentBalance: '280000',
  currentRate: '7',
  currentTermValue: '27',
  currentTermUnit: 'years',
  newRate: '6',
  newTermValue: '30',
  newTermUnit: 'years',
  closingCosts: '6000',
  financeClosingCosts: '',
  stayYears: '7'
});

/** "If you sell or pay off after…" checkpoints, in years. */
export const REFI_HORIZON_YEARS = Object.freeze([1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40]);

export function parseRefiForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };

  const currentBalance = take('currentBalance', numberField(values.currentBalance, {
    label: 'Current loan balance', min: 0, minExclusive: true, max: REFI_LIMITS.maxBalance
  }));
  const currentRate = take('currentRate', numberField(values.currentRate, { label: 'Current interest rate', min: 0, max: REFI_LIMITS.maxRate }));
  const currentTermMonths = take('currentTermValue', termField(values.currentTermValue, values.currentTermUnit, {
    label: 'Time left on current loan', maxMonths: REFI_LIMITS.maxTermMonths
  }));
  const newRate = take('newRate', numberField(values.newRate, { label: 'New interest rate', min: 0, max: REFI_LIMITS.maxRate }));
  const newTermMonths = take('newTermValue', termField(values.newTermValue, values.newTermUnit, {
    label: 'New loan term', maxMonths: REFI_LIMITS.maxTermMonths
  }));
  const closingCosts = take('closingCosts', numberField(values.closingCosts, {
    label: 'Closing costs', required: false, fallback: 0, min: 0, max: REFI_LIMITS.maxBalance
  }));
  const stayMonths = String(values.stayYears ?? '').trim() === ''
    ? null
    : take('stayYears', termField(values.stayYears, 'years', { label: 'Time you expect to keep the loan', maxMonths: REFI_LIMITS.maxTermMonths }));
  const financeClosingCosts = values.financeClosingCosts === 'on' || values.financeClosingCosts === 'true';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: { currentBalance, currentRate, currentTermMonths, newRate, newTermMonths, closingCosts, financeClosingCosts, stayMonths }
  };
}

function horizonMonths(horizon, stayMonths) {
  const months = REFI_HORIZON_YEARS.map((years) => years * 12).filter((month) => month <= horizon);
  if (stayMonths && stayMonths <= horizon) months.push(stayMonths);
  return [...new Set(months)].sort((a, b) => a - b);
}

export function buildRefiView(input) {
  const result = calculateMortgageRefinance({
    currentBalance: input.currentBalance,
    currentAPR: input.currentRate,
    currentTermMonths: input.currentTermMonths,
    newAPR: input.newRate,
    newTermMonths: input.newTermMonths,
    closingCosts: input.closingCosts,
    financeClosingCosts: input.financeClosingCosts,
    plannedStayMonths: input.stayMonths
  });
  const cashCosts = input.financeClosingCosts ? 0 : input.closingCosts;

  return {
    input,
    current: {
      payment: result.currentMonthlyPayment,
      months: input.currentTermMonths,
      totalInterest: result.currentTotalInterest,
      totalCost: result.currentTotalRepayment
    },
    refinance: {
      payment: result.newMonthlyPayment,
      months: input.newTermMonths,
      principal: result.newPrincipal,
      totalInterest: result.newTotalInterest,
      totalCost: result.refinanceTotalCost,
      cashCosts
    },
    monthlySavings: result.monthlySavings,
    simpleBreakEvenMonths: Number.isFinite(result.breakEvenMonths) ? result.breakEvenMonths : null,
    aheadWindow: result.aheadWindow,
    lifetimeSavings: result.netLifetimeSavings,
    termReset: result.termResetWarning,
    stay: input.stayMonths ? { months: input.stayMonths, netSavings: result.netSavingsAt(input.stayMonths) } : null,
    horizon: horizonMonths(result.horizonMonths, input.stayMonths).map((month) => ({
      ...result.positionAt(month),
      isStay: month === input.stayMonths
    }))
  };
}

/**
 * Parse, validate and calculate in one step. Engine range errors become
 * field errors instead of exceptions.
 */
export function runRefiCalculator(values) {
  const parsed = parseRefiForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildRefiView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { newRate: 'These numbers are too extreme to calculate. Check the rates and terms.' } };
  }
}
