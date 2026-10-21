/**
 * Adapter between the Solar Price Per Watt Calculator page and its engine.
 * Parses the form, calls calculatePricePerWatt() and shapes the result for
 * display. No formulas live here.
 */

import { calculatePricePerWatt, MAX_PRICE_CENTS, SIZE_LIMITS } from '../../calculators/energy/solar-price-per-watt.js';
import { moneyField } from '../../lib/energy/money.js';
import { numberField } from '../../lib/validation.js';
import { roundHalfUp } from '../../lib/energy/format.js';

/** Illustrative example quote, not a typical or current price. */
export const PPW_DEFAULTS = Object.freeze({
  price: '24000',
  size: '8',
  unit: 'kW',
  incentives: ''
});

export const formatPerWatt = (dollars) => `$${roundHalfUp(dollars, 2)}/W`;

export function parsePpwForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const unit = values.unit === 'W' ? 'W' : 'kW';
  const priceCents = take('price', moneyField(values.price, { label: 'Installed price', min: 0.01, max: MAX_PRICE_CENTS / 100 }));
  const size = take('size', numberField(values.size, { label: 'System size', min: SIZE_LIMITS[unit].min, max: SIZE_LIMITS[unit].max }));
  const incentivesCents = take('incentives', moneyField(values.incentives, { label: 'Incentives received', required: false, fallback: 0, min: 0 }));
  if (!errors.price && !errors.incentives && incentivesCents > priceCents) errors.incentives = 'Incentives cannot be more than the installed price.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { priceCents, size, unit, incentivesCents } };
}

export function buildPpwView(input) {
  const result = calculatePricePerWatt(input);
  return {
    input,
    result,
    gross: formatPerWatt(result.grossPerWatt),
    net: formatPerWatt(result.netPerWatt),
    hasIncentives: input.incentivesCents > 0
  };
}

/** Parse, validate and calculate. */
export function runPpwCalculator(values) {
  const parsed = parsePpwForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildPpwView(parsed.input) };
}
