/**
 * Adapter between the EV Cost Per Mile Calculator page and its engine. Parses
 * the form, calls calculateEvCostPerMile() and shapes the result for display.
 * No formulas live here. Charging efficiency has no default value and is
 * accepted only with a dashboard figure.
 */

import { calculateEvCostPerMile, PER_MILE_LIMITS } from '../../calculators/energy/ev-cost-per-mile.js';
import { numberField } from '../../lib/validation.js';
import { formatCentsAndDollars, roundHalfUp } from '../../lib/energy/format.js';
import { rateField } from './electric-bill.js';
import { FIGURE_TYPE_ERROR } from './ev-charging-cost.js';

export const PER_MILE_NOTES = Object.freeze({
  highRate: 'Higher than any U.S. state\'s 2025 all-sector average (EIA).',
  lowEfficiency: 'Efficiency is unusually low; check the value.'
});

export const EPA_EFFICIENCY_ERROR = 'Charging efficiency is not used with the EPA figure (it already includes charging losses). Leave it blank.';

/** Illustrative example values, not typical ones: the EPA figure path, no efficiency. */
export const PER_MILE_DEFAULTS = Object.freeze({
  rate: '0.15',
  figureType: 'epa',
  figure: '30',
  efficiency: '',
  annualMiles: '12000'
});

export function parsePerMileForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const rate = take('rate', rateField(values.rate, 'Electricity rate'));
  const figureType = values.figureType === 'epa' || values.figureType === 'dashboard' ? values.figureType : null;
  if (figureType === null) errors.figureType = FIGURE_TYPE_ERROR;
  // Without a figure type the limits are unknown, so only the number itself is checked.
  const figure = take('figure', numberField(values.figure, { label: 'Figure value', ...(figureType ? PER_MILE_LIMITS[figureType] : {}) }));
  let efficiencyPercent = null;
  const efficiencyBlank = String(values.efficiency ?? '').trim() === '';
  if (figureType === 'epa' && !efficiencyBlank) errors.efficiency = EPA_EFFICIENCY_ERROR;
  else if (figureType === 'dashboard') efficiencyPercent = take('efficiency', numberField(values.efficiency, { label: 'Charging efficiency', ...PER_MILE_LIMITS.efficiency }));
  const annualMiles = take('annualMiles', numberField(values.annualMiles, { label: 'Miles per year', required: false, fallback: null, ...PER_MILE_LIMITS.miles }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { rate, figureType, figure, efficiencyPercent, annualMiles } };
}

export function buildPerMileView(input) {
  const result = calculateEvCostPerMile(input);
  const notes = [];
  if (result.highRate) notes.push(PER_MILE_NOTES.highRate);
  if (input.efficiencyPercent !== null && input.efficiencyPercent < 50) notes.push(PER_MILE_NOTES.lowEfficiency);
  return {
    input,
    result,
    perMileText: formatCentsAndDollars(result.costPerMile),
    milesPerKwhText: result.milesPerKwh === null ? null : roundHalfUp(result.milesPerKwh, 2),
    notes
  };
}

/** Parse, validate and calculate. */
export function runPerMileCalculator(values) {
  const parsed = parsePerMileForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildPerMileView(parsed.input) };
}
