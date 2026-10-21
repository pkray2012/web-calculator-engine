/**
 * Adapter between the Utility Cost Calculator page and its engine. Parses the
 * bill amounts to cents, calls calculateUtilityCost() and shapes the result
 * for display. No formulas live here.
 */

import { calculateUtilityCost, UTILITY_CATEGORIES, MAX_BILL_CENTS } from '../../calculators/energy/utility-cost.js';
import { moneyField } from '../../lib/energy/money.js';
import { formatShare, roundHalfUp } from '../../lib/energy/format.js';

export const UTILITY_LABELS = Object.freeze({
  electricity: 'Electricity',
  gas: 'Gas',
  water: 'Water',
  sewer: 'Sewer',
  trash: 'Trash',
  internet: 'Internet',
  other: 'Other'
});

/** Illustrative example bills, not typical or current amounts. */
export const UTILITY_DEFAULTS = Object.freeze({
  electricity: '120',
  gas: '60',
  water: '45',
  sewer: '30',
  trash: '25',
  internet: '',
  other: '70'
});

export function parseUtilityForm(values) {
  const errors = {};
  const billsCents = {};
  for (const category of UTILITY_CATEGORIES) {
    const result = moneyField(values[category], { label: UTILITY_LABELS[category], required: false, fallback: null, min: 0, max: MAX_BILL_CENTS / 100 });
    if (result.error) errors[category] = result.error;
    else billsCents[category] = result.value;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { billsCents } };
}

export function buildUtilityView(input) {
  const result = calculateUtilityCost(input.billsCents);
  const shares = result.shares
    ? UTILITY_CATEGORIES.filter((category) => category in result.shares).map((category) => ({
      category,
      label: UTILITY_LABELS[category],
      amount: input.billsCents[category] / 100,
      share: result.shares[category],
      shareText: formatShare(result.shares[category])
    }))
    : null;
  // Rounded shares may add to 99.9% or 100.1%; say so rather than adjust them.
  const shownTotal = shares ? shares.reduce((sum, row) => sum + Math.round(Number(roundHalfUp(row.share, 1, { grouping: false })) * 10), 0) : 0;
  return {
    input,
    result,
    shares,
    sharesNote: shares && shownTotal !== 1000 ? 'Shares are rounded, so they may not add up to exactly 100.0%.' : null,
    message: shares ? null : 'Enter at least one amount.'
  };
}

/** Parse, validate and calculate. */
export function runUtilityCalculator(values) {
  const parsed = parseUtilityForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildUtilityView(parsed.input) };
}
