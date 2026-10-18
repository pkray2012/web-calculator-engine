/**
 * Adapter between the Estimated Tax Calculator page and its engine. Parses raw
 * form values, calls the engine and shapes the result for display. No formulas
 * live here.
 */

import { calculateEstimatedTax, ESTIMATED_TAX_YEARS } from '../calculators/estimated-tax.js';
import { numberField } from '../lib/validation.js';

/** Illustrative example values, not a typical taxpayer. */
export const ESTIMATED_TAX_DEFAULTS = Object.freeze({
  currentYearTax: '20000',
  withholding: '2000',
  priorYearTax: '15000',
  priorYearAgi: '90000',
  marriedFilingSeparately: ''
});

const MAX_AMOUNT = 100_000_000;

export function parseEstimatedTaxForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const money = (field, label, required = false, fallback = 0) =>
    take(field, numberField(values[field], { label, required, fallback, min: 0, max: MAX_AMOUNT }));
  const currentYearTax = money('currentYearTax', 'Expected total tax this year', true);
  const withholding = money('withholding', 'Withholding this year');
  const priorYearTax = money('priorYearTax', 'Last year’s total tax', false, null);
  const priorYearAgi = money('priorYearAgi', 'Last year’s adjusted gross income', false, null);
  // Without last year's AGI the 100%/110% choice cannot be made, and assuming
  // 100% could tell a higher-income filer to pay too little (review A3-003).
  if (priorYearTax !== null && priorYearAgi === null && !errors.priorYearAgi) {
    errors.priorYearAgi = 'Enter last year’s adjusted gross income. It decides whether 100% or 110% of last year’s tax applies.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      taxYear: ESTIMATED_TAX_YEARS.at(-1),
      currentYearTax,
      withholding,
      priorYearTax,
      priorYearAgi,
      marriedFilingSeparately: values.marriedFilingSeparately === 'on'
    }
  };
}

export function buildEstimatedTaxView(input) {
  return { input, result: calculateEstimatedTax(input) };
}

/** Parse, validate and calculate. */
export function runEstimatedTaxCalculator(values) {
  const parsed = parseEstimatedTaxForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildEstimatedTaxView(parsed.input) };
}
