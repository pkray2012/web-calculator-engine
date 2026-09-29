/**
 * Adapter between the Home Affordability Calculator page and its engine.
 * Parses raw form values, calls calculateAffordabilityPlan() and shapes the
 * result for display. No financial formulas live here.
 */

import { calculateAffordabilityPlan } from '../calculators/mortgage-affordability.js';
import { numberField } from '../lib/validation.js';

export const AFFORDABILITY_LIMITS = Object.freeze({ maxMoney: 50_000_000, maxRate: 25, maxTermYears: 40, maxTaxRate: 10, maxPmiRate: 5 });

/** Illustrative example values; the page labels them as an example, not market rates or local taxes. */
export const AFFORDABILITY_DEFAULTS = Object.freeze({
  annualIncome: '100000',
  monthlyDebt: '500',
  downPayment: '40000',
  annualRate: '6.5',
  termYears: '30',
  propertyTaxRate: '1.1',
  insuranceYearly: '1800',
  hoaMonthly: '',
  pmiRate: '0.5',
  frontEndRatio: '28',
  backEndRatio: '36'
});

export function parseAffordabilityForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, rules = {}) => take(field, numberField(values[field], { label, min: 0, max: AFFORDABILITY_LIMITS.maxMoney, ...rules }));
  const annualIncome = money('annualIncome', 'Yearly income', { minExclusive: true });
  const monthlyDebt = money('monthlyDebt', 'Monthly debt payments', { required: false, fallback: 0 });
  const downPayment = money('downPayment', 'Down payment', { required: false, fallback: 0 });
  const annualRate = take('annualRate', numberField(values.annualRate, { label: 'Interest rate', min: 0, max: AFFORDABILITY_LIMITS.maxRate }));
  const termYears = take('termYears', numberField(values.termYears, { label: 'Loan term', min: 0, minExclusive: true, max: AFFORDABILITY_LIMITS.maxTermYears, integer: true }));
  const propertyTaxRate = take('propertyTaxRate', numberField(values.propertyTaxRate, { label: 'Property tax rate', required: false, fallback: 0, min: 0, max: AFFORDABILITY_LIMITS.maxTaxRate }));
  const insuranceYearly = money('insuranceYearly', 'Homeowners insurance', { required: false, fallback: 0 });
  const hoaMonthly = money('hoaMonthly', 'HOA dues', { required: false, fallback: 0 });
  const pmiRate = take('pmiRate', numberField(values.pmiRate, { label: 'PMI rate', required: false, fallback: 0, min: 0, max: AFFORDABILITY_LIMITS.maxPmiRate }));
  const frontEndRatio = take('frontEndRatio', numberField(values.frontEndRatio, { label: 'Housing limit', min: 0, minExclusive: true, max: 100 }));
  const backEndRatio = take('backEndRatio', numberField(values.backEndRatio, { label: 'Total debt limit', min: 0, minExclusive: true, max: 100 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { annualIncome, monthlyDebt, downPayment, annualRate, termYears, propertyTaxRate, insuranceYearly, hoaMonthly, pmiRate, frontEndRatio, backEndRatio } };
}

export function buildAffordabilityView(input) {
  const plan = calculateAffordabilityPlan({
    annualIncome: input.annualIncome,
    monthlyDebt: input.monthlyDebt,
    downPayment: input.downPayment,
    annualRate: input.annualRate,
    termYears: input.termYears,
    frontEndRatio: input.frontEndRatio / 100,
    backEndRatio: input.backEndRatio / 100,
    annualPropertyTax: 0,
    propertyTaxRate: input.propertyTaxRate,
    annualInsurance: input.insuranceYearly,
    monthlyHoa: input.hoaMonthly,
    annualPmiRate: input.pmiRate
  });
  return { input, ...plan, affordable: plan.maxHomePrice > 0 };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runAffordabilityCalculator(values) {
  const parsed = parseAffordabilityForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildAffordabilityView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { annualRate: 'These numbers are too extreme to calculate. Check the rate and term.' } };
  }
}
