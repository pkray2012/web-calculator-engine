/**
 * Adapter between the two charging-time pages (Solar Battery Charging Time
 * and EV Charging Time) and the shared engine. Parses the form, calls
 * calculateChargeTime() and shapes the result for display. No formulas live
 * here.
 *
 * The measurement point has no default: a charger's, station's or vehicle's
 * displayed power is not assumed to be measured going into the battery.
 * Efficiency has no default value either.
 */

import { calculateChargeTime, CHARGE_LIMITS } from '../../calculators/energy/charging-time.js';
import { numberField } from '../../lib/validation.js';
import { formatKwh, formatHours } from '../../lib/energy/format.js';

export const CHARGE_NOTES = Object.freeze({
  nothing: 'Nothing to charge.',
  long: 'This is unusually long for the inputs; check power, efficiency and capacity.',
  lowEfficiency: 'Efficiency is unusually low; check the value.',
  acOnly: 'Applies to AC charging only.'
});

/** Form values for the solar battery page: the example's numbers, with no measurement point or efficiency chosen. */
export const BATTERY_DEFAULTS = Object.freeze({
  capacity: '10',
  startLevel: '30',
  targetLevel: '100',
  power: '1.5',
  basis: '',
  efficiency: ''
});

/** Form values for the EV page. */
export const EV_TIME_DEFAULTS = Object.freeze({
  capacity: '75',
  startLevel: '20',
  targetLevel: '80',
  power: '7.2',
  basis: '',
  efficiency: '',
  vehicleMax: ''
});

/**
 * Shared parsing for the battery-and-levels part of every charging form (also used by EV Charging Cost).
 * @param {Record<string, string>} values raw form values
 * @param {(field: string, result: any) => any} take records a field's error and returns its value
 * @param {string} [startLabel] the start-level field's visible label
 */
export function parseLevels(values, take, startLabel = 'Current charge level') {
  const capacityKwh = take('capacity', numberField(values.capacity, { label: 'Usable battery capacity', ...CHARGE_LIMITS.capacity }));
  const startPercent = take('startLevel', numberField(values.startLevel, { label: startLabel, min: 0, max: 100 }));
  const targetPercent = take('targetLevel', numberField(values.targetLevel, { label: 'Target charge level', min: 0, max: 100 }));
  return { capacityKwh, startPercent, targetPercent };
}

/**
 * @param {Record<string, string>} values raw form values
 * @param {{ vehicle?: boolean }} [options] vehicle: the form has the vehicle's maximum AC rate
 */
export function parseChargeForm(values, { vehicle = false } = {}) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const { capacityKwh, startPercent, targetPercent } = parseLevels(values, take, vehicle ? 'Start charge level' : 'Current charge level');
  const powerKw = take('power', numberField(values.power, { label: 'Charging power', ...CHARGE_LIMITS.power }));
  const basis = values.basis === 'wall' || values.basis === 'battery' ? values.basis : null;
  if (!basis) errors.basis = 'Choose where the charging power is measured.';
  const efficiencyPercent = take('efficiency', numberField(values.efficiency, {
    label: 'Charging efficiency', required: basis === 'wall', fallback: null, ...CHARGE_LIMITS.efficiency
  }));
  const vehicleMaxKw = vehicle
    ? take('vehicleMax', numberField(values.vehicleMax, { label: 'Vehicle\'s maximum AC charging rate', required: false, fallback: null, ...CHARGE_LIMITS.power }))
    : null;
  if (!errors.startLevel && !errors.targetLevel && targetPercent < startPercent) errors.targetLevel = 'Target charge level cannot be below the starting level.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { capacityKwh, startPercent, targetPercent, powerKw, basis, efficiencyPercent, vehicleMaxKw } };
}

export function buildChargeView(input) {
  const result = calculateChargeTime(input);
  const notes = [];
  if (result.unusuallyLong) notes.push(CHARGE_NOTES.long);
  if (result.lowEfficiency) notes.push(CHARGE_NOTES.lowEfficiency);
  if (result.vehicleCapIgnored) notes.push(CHARGE_NOTES.acOnly);
  return {
    input,
    result,
    energyText: formatKwh(result.energyKwh),
    timeText: formatHours(result.hours),
    sourceText: result.sourceKwh === null ? null : formatKwh(result.sourceKwh),
    message: result.nothingToCharge ? CHARGE_NOTES.nothing : null,
    notes
  };
}

export function runChargeCalculator(values, options) {
  const parsed = parseChargeForm(values, options);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildChargeView(parsed.input) };
}

export const runBatteryCalculator = (values) => runChargeCalculator(values, { vehicle: false });
export const runEvTimeCalculator = (values) => runChargeCalculator(values, { vehicle: true });
