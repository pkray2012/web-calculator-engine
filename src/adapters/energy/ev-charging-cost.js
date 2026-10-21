/**
 * Adapter between the EV Charging Cost Calculator page and its engine. Parses
 * the form, calls calculateEvChargingCost() and shapes the result for
 * display. No formulas live here. Charging efficiency has no default value.
 */

import { calculateEvChargingCost, COST_LIMITS } from '../../calculators/energy/ev-charging-cost.js';
import { numberField } from '../../lib/validation.js';
import { formatKwh, formatCentsAndDollars } from '../../lib/energy/format.js';
import { parseLevels } from './charging-time.js';
import { rateField } from './electric-bill.js';

export const COST_NOTES = Object.freeze({
  highRate: 'Higher than any U.S. state\'s 2025 all-sector average (EIA).',
  lowEfficiency: 'Efficiency is unusually low; check the value.',
  highMonthly: 'Check your inputs: this monthly cost is unusually high.',
  nothing: 'Nothing to charge.'
});

export const FIGURE_TYPE_ERROR = 'Choose the figure type (EPA kWh/100 mi or dashboard mi/kWh).';

/** Form values: the example's numbers, with no efficiency and the per-mile section off. */
export const EV_COST_DEFAULTS = Object.freeze({
  capacity: '75',
  startLevel: '20',
  targetLevel: '80',
  efficiency: '',
  rate: '0.15',
  figureType: '',
  figure: '',
  milesPerMonth: ''
});

export function parseEvCostForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const { capacityKwh, startPercent, targetPercent } = parseLevels(values, take, 'Start charge level');
  const efficiencyPercent = take('efficiency', numberField(values.efficiency, { label: 'Charging efficiency', ...COST_LIMITS.efficiency }));
  const rate = take('rate', rateField(values.rate, 'Electricity rate'));
  const figureType = values.figureType === 'epa' || values.figureType === 'dashboard' ? values.figureType : null;
  // Without a figure type the limits are unknown, so only the number itself is checked and the figure-type error explains what is missing.
  const figureLimits = figureType === 'dashboard' ? COST_LIMITS.dashboard : figureType === 'epa' ? COST_LIMITS.epa : {};
  const figure = take('figure', numberField(values.figure, { label: 'Figure value', required: figureType !== null, fallback: null, ...figureLimits }));
  const milesPerMonth = take('milesPerMonth', numberField(values.milesPerMonth, { label: 'Miles per month', required: false, fallback: null, ...COST_LIMITS.miles }));
  if (figureType === null && !errors.figure && !errors.milesPerMonth && (figure !== null || milesPerMonth !== null)) errors.figureType = FIGURE_TYPE_ERROR;
  if (!errors.startLevel && !errors.targetLevel && targetPercent < startPercent) errors.targetLevel = 'Target charge level cannot be below the starting level.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { capacityKwh, startPercent, targetPercent, efficiencyPercent, rate, figureType, figure: figureType ? figure : null, milesPerMonth: figureType ? milesPerMonth : null } };
}

export function buildEvCostView(input) {
  const result = calculateEvChargingCost(input);
  const notes = [];
  if (result.highRate) notes.push(COST_NOTES.highRate);
  if (input.efficiencyPercent < 50) notes.push(COST_NOTES.lowEfficiency);
  if (result.perMile?.highMonthly) notes.push(COST_NOTES.highMonthly);
  return {
    input,
    result,
    batteryText: formatKwh(result.batteryKwh),
    meteredText: formatKwh(result.meteredKwh),
    perMileText: result.perMile ? formatCentsAndDollars(result.perMile.costPerMile) : null,
    message: result.batteryKwh === 0 ? COST_NOTES.nothing : null,
    notes
  };
}

/** Parse, validate and calculate. */
export function runEvCostCalculator(values) {
  const parsed = parseEvCostForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildEvCostView(parsed.input) };
}
