/**
 * Adapter between the Sales Tax Calculator page and its engine. Parses raw
 * form values, calls the engine for the selected mode and shapes the result
 * for display. No formulas live here.
 */

import { addSalesTax, removeSalesTax, findSalesTaxRate } from '../calculators/sales-tax.js';
import { numberField } from '../lib/validation.js';

const MODES = ['add', 'remove', 'rate'];

/** Illustrative example values: a $250 purchase at a 7.25% combined rate. */
export const SALES_TAX_DEFAULTS = Object.freeze({
  mode: 'add',
  price: '250',
  ratePercent: '7.25',
  total: '268.13',
  ratePrice: '250',
  rateTotal: '268.13'
});

export function parseSalesTaxForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const mode = MODES.includes(values.mode) ? values.mode : 'add';
  const money = (field, label) => take(field, numberField(values[field], { label, min: 0, max: 1_000_000_000 }));
  const rate = () => take('ratePercent', numberField(values.ratePercent, { label: 'Sales tax rate', min: 0, max: 100 }));
  let input;
  if (mode === 'add') input = { mode, price: money('price', 'Price before tax'), ratePercent: rate() };
  else if (mode === 'remove') input = { mode, total: money('total', 'Total with tax'), ratePercent: rate() };
  else {
    const price = take('ratePrice', numberField(values.ratePrice, { label: 'Price before tax', min: 0, minExclusive: true, max: 1_000_000_000 }));
    const total = money('rateTotal', 'Total with tax');
    if (!errors.ratePrice && !errors.rateTotal && total < price) errors.rateTotal = 'Total with tax cannot be less than the price before tax.';
    input = { mode, price, total };
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input };
}

export function buildSalesTaxView(input) {
  if (input.mode === 'add') return { input, result: addSalesTax(input) };
  if (input.mode === 'remove') return { input, result: removeSalesTax(input) };
  return { input, result: findSalesTaxRate(input) };
}

/** Parse, validate and calculate. */
export function runSalesTaxCalculator(values) {
  const parsed = parseSalesTaxForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildSalesTaxView(parsed.input) };
}
