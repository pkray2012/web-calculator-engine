/**
 * Adapter between the Auto Loan Refinance Calculator page and its engine.
 * Parses raw form values, calls calculateAutoLoanRefinance() and shapes the
 * result for display. No financial formulas live here.
 */

import { calculateAutoLoanRefinance } from '../calculators/auto-loan-refinance.js';
import { numberField, termField } from '../lib/validation.js';

export const AUTO_REFI_LIMITS = Object.freeze({ maxBalance: 500_000, maxRate: 40, maxTermMonths: 120, maxCosts: 50_000 });

/** Illustrative example values; the page labels them as an example, not market rates. */
export const AUTO_REFI_DEFAULTS = Object.freeze({
  currentBalance: '22000',
  currentRate: '9.5',
  currentTermValue: '48',
  currentTermUnit: 'months',
  newRate: '6.5',
  newTermValue: '48',
  newTermUnit: 'months',
  fees: '300',
  prepaymentPenalty: '',
  financeCosts: '',
  keepMonths: '24'
});

/** "If you sell or trade in after…" checkpoints, in months. */
export const AUTO_REFI_HORIZON_MONTHS = Object.freeze([6, 12, 18, 24, 36, 48, 60, 72, 84, 96, 120]);

export function parseAutoRefiForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const currentBalance = take('currentBalance', numberField(values.currentBalance, { label: 'Payoff amount', min: 0, minExclusive: true, max: AUTO_REFI_LIMITS.maxBalance }));
  const currentRate = take('currentRate', numberField(values.currentRate, { label: 'Current interest rate', min: 0, max: AUTO_REFI_LIMITS.maxRate }));
  const currentTermMonths = take('currentTermValue', termField(values.currentTermValue, values.currentTermUnit, { label: 'Time left on current loan', maxMonths: AUTO_REFI_LIMITS.maxTermMonths }));
  const newRate = take('newRate', numberField(values.newRate, { label: 'New interest rate', min: 0, max: AUTO_REFI_LIMITS.maxRate }));
  const newTermMonths = take('newTermValue', termField(values.newTermValue, values.newTermUnit, { label: 'New loan term', maxMonths: AUTO_REFI_LIMITS.maxTermMonths }));
  const fees = take('fees', numberField(values.fees, { label: 'Refinance fees', required: false, fallback: 0, min: 0, max: AUTO_REFI_LIMITS.maxCosts }));
  const prepaymentPenalty = take('prepaymentPenalty', numberField(values.prepaymentPenalty, { label: 'Prepayment penalty', required: false, fallback: 0, min: 0, max: AUTO_REFI_LIMITS.maxCosts }));
  const keepMonths = String(values.keepMonths ?? '').trim() === ''
    ? null
    : take('keepMonths', numberField(values.keepMonths, { label: 'Time you expect to keep the car', min: 0, minExclusive: true, max: AUTO_REFI_LIMITS.maxTermMonths, integer: true }));
  const financeCosts = values.financeCosts === 'on' || values.financeCosts === 'true';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { currentBalance, currentRate, currentTermMonths, newRate, newTermMonths, fees, prepaymentPenalty, financeCosts, keepMonths } };
}

function horizonMonths(horizon, keepMonths) {
  const months = AUTO_REFI_HORIZON_MONTHS.filter((month) => month <= horizon);
  if (keepMonths && keepMonths <= horizon) months.push(keepMonths);
  return [...new Set(months)].sort((a, b) => a - b);
}

export function buildAutoRefiView(input) {
  const result = calculateAutoLoanRefinance({
    currentBalance: input.currentBalance,
    currentRate: input.currentRate,
    currentTermMonths: input.currentTermMonths,
    newRate: input.newRate,
    newTermMonths: input.newTermMonths,
    fees: input.fees,
    prepaymentPenalty: input.prepaymentPenalty,
    financeCosts: input.financeCosts,
    plannedKeepMonths: input.keepMonths
  });
  const keepMonths = input.keepMonths === null ? null : Math.min(input.keepMonths, result.horizonMonths);
  return {
    input,
    current: { payment: result.currentPayment, months: input.currentTermMonths, totalInterest: result.currentTotalInterest, totalCost: result.currentTotalCost },
    refinance: {
      payment: result.newPayment,
      months: input.newTermMonths,
      principal: result.newPrincipal,
      totalInterest: result.newTotalInterest,
      totalCost: result.newTotalCost,
      costs: result.refinanceCosts,
      cashCosts: result.cashCosts
    },
    monthlySavings: result.monthlySavings,
    simpleBreakEvenMonths: result.simpleBreakEvenMonths,
    aheadWindow: result.aheadWindow,
    lifetimeSavings: result.lifetimeSavings,
    extraMonths: result.extraMonths,
    keep: keepMonths === null ? null : { months: keepMonths, netSavings: result.netSavingsAt(keepMonths) },
    horizon: horizonMonths(result.horizonMonths, keepMonths).map((month) => ({ ...result.positionAt(month), isKeep: month === keepMonths }))
  };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runAutoRefiCalculator(values) {
  const parsed = parseAutoRefiForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildAutoRefiView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { newRate: 'These numbers are too extreme to calculate. Check the rates and terms.' } };
  }
}
