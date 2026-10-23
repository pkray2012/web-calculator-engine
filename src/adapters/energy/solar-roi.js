/**
 * Adapter between the Solar ROI Calculator page and its engine. Parses the
 * form, calls calculateSolarRoi() and shapes the result for display. No
 * formulas live here.
 */

import { calculateSolarRoi, ROI_LIMITS } from '../../calculators/energy/solar-roi.js';
import { MAX_AMOUNT_CENTS } from '../../calculators/energy/solar-payback.js';
import { moneyField } from '../../lib/energy/money.js';
import { numberField } from '../../lib/validation.js';
import { ratioDecimal } from '../../lib/energy/format.js';
import { formatCurrency } from '../../lib/format.js';
import { LONG_PAYBACK_NOTE } from './solar-payback.js';

export const NOT_DEFINED = 'Not defined: incentives cover the whole cost';

/** Illustrative example values (as on the Solar Payback page), not typical prices or savings. */
export const ROI_DEFAULTS = Object.freeze({
  cost: '20000',
  incentives: '',
  savings: '1600',
  maintenance: '0',
  years: '25'
});

export function parseRoiForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const max = MAX_AMOUNT_CENTS / 100;
  const costCents = take('cost', moneyField(values.cost, { label: 'Installed cost', min: 0.01, max }));
  const incentivesCents = take('incentives', moneyField(values.incentives, { label: 'Incentives received', required: false, fallback: 0, min: 0, max }));
  const savingsCents = take('savings', moneyField(values.savings, { label: 'Yearly bill savings', min: 0, max }));
  const maintenanceCents = take('maintenance', moneyField(values.maintenance, { label: 'Yearly maintenance', min: 0, max }));
  const years = take('years', numberField(values.years, { label: 'Years', ...ROI_LIMITS.years, integer: true }));
  if (!errors.cost && !errors.incentives && incentivesCents > costCents) errors.incentives = 'Incentives cannot be more than the installed cost.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { costCents, incentivesCents, savingsCents, maintenanceCents, years } };
}

export function buildRoiView(input) {
  const result = calculateSolarRoi(input);
  const money = (cents) => formatCurrency(cents / 100);
  return {
    input,
    result,
    roiText: result.defined ? `${ratioDecimal(result.roiRatio, 1)}%` : NOT_DEFINED,
    netCostText: money(result.netCostCents),
    totalText: money(result.totalNetSavingsCents),
    gainText: money(result.netGainCents),
    notes: result.longPeriod ? [LONG_PAYBACK_NOTE] : []
  };
}

/** Parse, validate and calculate. */
export function runRoiCalculator(values) {
  const parsed = parseRoiForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildRoiView(parsed.input) };
}
