/**
 * Adapter between the Profit Margin Calculator page and its engine. Parses
 * raw form values, calls the engine for the selected mode and shapes the
 * result for display. No formulas live here.
 */

import { analyzeSale, priceForMargin, priceForMarkup } from '../calculators/margin.js';
import { numberField } from '../lib/validation.js';

const MODES = ['cp', 'margin', 'markup'];

/** Illustrative example values: an item that costs $30 and sells for $50. */
export const MARGIN_DEFAULTS = Object.freeze({
  mode: 'cp',
  cost: '30',
  price: '50',
  marginPercent: '40',
  markupPercent: '50',
  fixedCosts: ''
});

export function parseMarginForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const mode = MODES.includes(values.mode) ? values.mode : 'cp';
  const cost = take('cost', numberField(values.cost, { label: 'Cost', min: 0, minExclusive: mode !== 'cp', max: 1_000_000_000 }));
  const fixedCosts = take('fixedCosts', numberField(values.fixedCosts, { label: 'Fixed costs', required: false, fallback: 0, min: 0, max: 1_000_000_000_000 }));
  let input;
  if (mode === 'cp') input = { mode, cost, price: take('price', numberField(values.price, { label: 'Selling price', min: 0, minExclusive: true, max: 1_000_000_000 })), fixedCosts };
  else if (mode === 'margin') input = { mode, cost, marginPercent: take('marginPercent', numberField(values.marginPercent, { label: 'Target margin', min: 0, max: 99.99 })), fixedCosts };
  else input = { mode, cost, markupPercent: take('markupPercent', numberField(values.markupPercent, { label: 'Markup', min: 0, max: 100_000 })), fixedCosts };
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input };
}

export function buildMarginView(input) {
  const sale = input.mode === 'cp' ? analyzeSale(input) : input.mode === 'margin' ? priceForMargin(input) : priceForMarkup(input);
  return { input, sale };
}

/** Parse, validate and calculate. */
export function runMarginCalculator(values) {
  const parsed = parseMarginForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildMarginView(parsed.input) };
}
