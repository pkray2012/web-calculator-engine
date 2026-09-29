/**
 * Adapter between the Mortgage Payment Calculator page and its engine. Parses
 * raw form values, calls calculateMortgagePayment() and shapes the result for
 * display. No financial formulas live here.
 */

import { calculateMortgagePayment } from '../calculators/mortgage-payment.js';
import { numberField, monthField, termField } from '../lib/validation.js';
import { summarizeByYear } from './amortized-view.js';
import { paymentMonth } from '../lib/format.js';

export const MORTGAGE_LIMITS = Object.freeze({ maxPrice: 50_000_000, maxRate: 25, maxTermMonths: 480, maxPmiRate: 5 });

/** Illustrative example values; the page labels them as an example, not market rates or local taxes. */
export const MORTGAGE_DEFAULTS = Object.freeze({
  homePrice: '400000',
  downPaymentValue: '10',
  downPaymentUnit: 'percent',
  annualRate: '6.5',
  termValue: '30',
  termUnit: 'years',
  propertyTaxYearly: '4800',
  insuranceYearly: '1800',
  pmiRate: '0.5',
  hoaMonthly: '',
  startMonth: ''
});

export function parseMortgageForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, rules = {}) => take(field, numberField(values[field], { label, min: 0, max: MORTGAGE_LIMITS.maxPrice, ...rules }));
  const homePrice = money('homePrice', 'Home price', { minExclusive: true });
  const percent = values.downPaymentUnit === 'percent';
  const down = take('downPaymentValue', numberField(values.downPaymentValue, { label: 'Down payment', required: false, fallback: 0, min: 0, max: percent ? 99.99 : MORTGAGE_LIMITS.maxPrice }));
  const annualRate = take('annualRate', numberField(values.annualRate, { label: 'Interest rate', min: 0, max: MORTGAGE_LIMITS.maxRate }));
  const termMonths = take('termValue', termField(values.termValue, values.termUnit, { maxMonths: MORTGAGE_LIMITS.maxTermMonths }));
  const propertyTaxYearly = money('propertyTaxYearly', 'Property tax', { required: false, fallback: 0 });
  const insuranceYearly = money('insuranceYearly', 'Homeowners insurance', { required: false, fallback: 0 });
  const pmiRate = take('pmiRate', numberField(values.pmiRate, { label: 'PMI rate', required: false, fallback: 0, min: 0, max: MORTGAGE_LIMITS.maxPmiRate }));
  const hoaMonthly = money('hoaMonthly', 'HOA dues', { required: false, fallback: 0 });
  const startMonth = take('startMonth', monthField(values.startMonth, { label: 'First payment month' }));
  const downPayment = errors.homePrice || errors.downPaymentValue ? 0 : (percent ? homePrice * down / 100 : down);
  if (!errors.homePrice && !errors.downPaymentValue && downPayment >= homePrice) {
    errors.downPaymentValue = 'Down payment must be less than the home price.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { homePrice, downPayment, annualRate, termMonths, propertyTaxYearly, insuranceYearly, pmiRate, hoaMonthly, startMonth, pmiRateEntered: String(values.pmiRate ?? '').trim() !== '' } };
}

export function buildMortgageView(input) {
  const { schedule, ...result } = calculateMortgagePayment(input);
  const dateOf = (months) => (input.startMonth && months ? paymentMonth(input.startMonth, months) : null);
  return {
    input,
    ...result,
    yearly: summarizeByYear(schedule),
    pmi: { ...result.pmi, canRequestDate: dateOf(result.pmi.canRequestMonth), autoEndDate: dateOf(result.pmi.autoEndMonth), rateMissing: result.pmi.required && !input.pmiRateEntered },
    payoff: dateOf(result.payments)
  };
}

/** Parse, validate and calculate. Engine range errors become field errors. */
export function runMortgageCalculator(values) {
  const parsed = parseMortgageForm(values);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, input: parsed.input, view: buildMortgageView(parsed.input) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { ok: false, errors: { annualRate: 'These numbers are too extreme to calculate. Check the rate and term.' } };
  }
}
