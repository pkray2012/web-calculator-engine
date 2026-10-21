/**
 * Adapter between the Solar Payback Period Calculator page and its engine.
 * Parses the form, calls calculateSimplePayback() and shapes the result for
 * display. No formulas live here.
 */

import { calculateSimplePayback, MAX_AMOUNT_CENTS } from '../../calculators/energy/solar-payback.js';
import { moneyField } from '../../lib/energy/money.js';
import { roundHalfUp } from '../../lib/energy/format.js';

/** Illustrative example values, not typical prices or savings. */
export const PAYBACK_DEFAULTS = Object.freeze({
  cost: '20000',
  incentives: '',
  savings: '1600',
  maintenance: '0'
});

export const LONG_PAYBACK_NOTE = 'Longer than the 25-year lifetime used as an example in the DOE/NREL document.';

/**
 * Payback in years as one rounded month count: "12.5 years (12 years 6 months)".
 * Under half a month → "Less than 1 month"; over 100 years → "More than 100 years".
 */
const count = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;

export function formatPayback(years) {
  if (years * 12 < 0.5) return 'Less than 1 month';
  if (years > 100) return 'More than 100 years';
  const months = Math.floor(years * 12 + 0.5);
  return `${roundHalfUp(months / 12, 1)} years (${count(Math.floor(months / 12), 'year')} ${count(months % 12, 'month')})`;
}

export function parsePaybackForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const max = MAX_AMOUNT_CENTS / 100;
  const costCents = take('cost', moneyField(values.cost, { label: 'Installed cost', min: 0.01, max }));
  const incentivesCents = take('incentives', moneyField(values.incentives, { label: 'Incentives received', required: false, fallback: 0, min: 0 }));
  const savingsCents = take('savings', moneyField(values.savings, { label: 'Yearly bill savings', min: 0, max }));
  const maintenanceCents = take('maintenance', moneyField(values.maintenance, { label: 'Yearly maintenance', min: 0, max }));
  if (!errors.cost && !errors.incentives && incentivesCents > costCents) errors.incentives = 'Incentives cannot be more than the installed cost.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { costCents, incentivesCents, savingsCents, maintenanceCents } };
}

export function buildPaybackView(input) {
  const result = calculateSimplePayback(input);
  const display = result.outcome === 'recovered' ? 'Recovered at installation'
    : result.outcome === 'undefined' ? 'Not defined: net annual savings are zero or negative'
      : formatPayback(result.years);
  const note = result.outcome === 'payback' && result.years > 25 && result.years <= 100 ? LONG_PAYBACK_NOTE : null;
  return { input, result, display, note, netCost: result.netCostCents / 100, netSavings: result.netSavingsCents / 100 };
}

/** Parse, validate and calculate. */
export function runPaybackCalculator(values) {
  const parsed = parsePaybackForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildPaybackView(parsed.input) };
}
