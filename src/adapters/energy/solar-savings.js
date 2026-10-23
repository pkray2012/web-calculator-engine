/**
 * Adapter between the Solar Savings Calculator page and its engine. Parses
 * the form, calls calculateSolarSavings() and shapes the result for display.
 * No formulas live here.
 */

import { calculateSolarSavings, SOLAR_SAVINGS_LIMITS } from '../../calculators/energy/solar-savings.js';
import { moneyField, roundRatioSigned } from '../../lib/energy/money.js';
import { numberField } from '../../lib/validation.js';
import { formatKwhRatio, ratioDecimal } from '../../lib/energy/format.js';
import { formatCurrency } from '../../lib/format.js';
import { rateField } from './electric-bill.js';

export const SOLAR_SAVINGS_NOTES = Object.freeze({
  highRate: 'Higher than any U.S. state\'s 2025 all-sector average (EIA).',
  exportAboveRetail: 'Your export credit is higher than your retail rate; check both values.',
  feesAboveSavings: 'With these inputs the solar fees are more than the bill savings.'
});

/** Form values: example production and retail rate; the share used at home and the export credit have no default. */
export const SOLAR_SAVINGS_DEFAULTS = Object.freeze({
  production: '10000',
  selfUse: '',
  retailRate: '0.16',
  exportRate: '',
  fees: ''
});

/** The pre-rendered example. Illustrative values, not typical ones or any plan's credit. */
export const SOLAR_SAVINGS_EXAMPLE = Object.freeze({ ...SOLAR_SAVINGS_DEFAULTS, selfUse: '60', exportRate: '0.05' });

export function parseSolarSavingsForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const L = SOLAR_SAVINGS_LIMITS;
  const production = take('production', numberField(values.production, { label: 'Yearly solar production', ...L.production }));
  const selfUse = take('selfUse', numberField(values.selfUse, { label: 'Share used at home', ...L.selfUse }));
  const retailRate = take('retailRate', rateField(values.retailRate, 'Retail rate'));
  const exportRate = take('exportRate', rateField(values.exportRate, 'Export credit'));
  const feesCents = take('fees', moneyField(values.fees, { label: 'Yearly solar fees', required: false, fallback: 0, min: 0, max: L.feesCents.max / 100 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { production, selfUse, retailRate, exportRate, feesCents } };
}

export function buildSolarSavingsView(input) {
  const result = calculateSolarSavings(input);
  const { exact } = result;
  const notes = [];
  if (result.highRate) notes.push(SOLAR_SAVINGS_NOTES.highRate);
  if (result.exportAboveRetail) notes.push(SOLAR_SAVINGS_NOTES.exportAboveRetail);
  if (result.feesAboveSavings) notes.push(SOLAR_SAVINGS_NOTES.feesAboveSavings);
  const savingsCents = roundRatioSigned(exact.savings, 2);
  const perMonthCents = roundRatioSigned(exact.savingsPerMonth, 2);
  return {
    input,
    result,
    savingsCents,
    perMonthCents,
    savingsText: formatCurrency(savingsCents / 100),
    perMonthText: formatCurrency(perMonthCents / 100),
    selfKwhText: formatKwhRatio(exact.selfKwh),
    exportedKwhText: formatKwhRatio(exact.exportedKwh),
    perKwhText: exact.centsPerSolarKwh ? `${ratioDecimal(exact.centsPerSolarKwh, 2)}¢` : '—',
    notes
  };
}

/** Parse, validate and calculate. */
export function runSolarSavingsCalculator(values) {
  const parsed = parseSolarSavingsForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildSolarSavingsView(parsed.input) };
}
