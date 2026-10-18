/**
 * Adapter between the Rent Affordability Calculator page and its engine.
 * Parses raw form values, calls the engine and shapes the result for display.
 * No formulas live here.
 */

import { calculateRentAffordability } from '../calculators/rent-affordability.js';
import { numberField } from '../lib/validation.js';

/** Illustrative example values. */
export const RENT_AFFORD_DEFAULTS = Object.freeze({
  annualGrossIncome: '60000',
  monthlyUtilities: '150',
  monthlyTakeHome: '3900',
  monthlyDebts: '400',
  monthlyEssentials: '1200',
  monthlySavings: '500',
  rentConsidered: '',
  housingSharePercent: '30',
  incomeMultiple: '40'
});

const MAX_AMOUNT = 100_000_000;

export function parseRentAffordabilityForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, fallback = 0) => take(field, numberField(values[field], { label, required: false, fallback, min: 0, max: MAX_AMOUNT }));
  const annualGrossIncome = take('annualGrossIncome', numberField(values.annualGrossIncome, { label: 'Yearly income before taxes', min: 0, max: MAX_AMOUNT }));
  const monthlyUtilities = money('monthlyUtilities', 'Utilities');
  const monthlyTakeHome = money('monthlyTakeHome', 'Monthly take-home pay', null);
  const monthlyDebts = money('monthlyDebts', 'Debt payments');
  const monthlyEssentials = money('monthlyEssentials', 'Other essentials');
  const monthlySavings = money('monthlySavings', 'Savings');
  const rentConsidered = money('rentConsidered', 'Rent you are considering', null);
  const housingSharePercent = take('housingSharePercent', numberField(values.housingSharePercent, { label: 'Share of income for housing', required: false, fallback: 30, min: 0, minExclusive: true, max: 100 }));
  const incomeMultiple = take('incomeMultiple', numberField(values.incomeMultiple, { label: 'Landlord income multiple', required: false, fallback: 40, min: 1, max: 200 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: { annualGrossIncome, monthlyUtilities, monthlyTakeHome, monthlyDebts, monthlyEssentials, monthlySavings, rentConsidered, housingSharePercent, incomeMultiple }
  };
}

export function buildRentAffordabilityView(input) {
  return { input, result: calculateRentAffordability(input) };
}

/** Parse, validate and calculate. */
export function runRentAffordabilityCalculator(values) {
  const parsed = parseRentAffordabilityForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildRentAffordabilityView(parsed.input) };
}
