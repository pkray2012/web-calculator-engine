/**
 * Cost of charging an electric vehicle at home.
 *
 * - Per charge: energy added to the battery = usable capacity × (target % −
 *   start %) ÷ 100; energy drawn from the wall = that ÷ charging efficiency;
 *   cost = energy drawn × rate per kWh.
 * - Per mile (optional), from one of two efficiency figures:
 *     EPA label kWh per 100 miles: cost per mile = kWh/100 mi ÷ 100 × rate.
 *       The label is based on the electricity drawn from the outlet, so it already includes charging
 *       losses and the charging efficiency is not applied again.
 *     Trip-computer miles per kWh: cost per mile = rate ÷ (mi/kWh × efficiency).
 *       The figure is used as the vehicle reports it, and the charging
 *       efficiency the user enters is applied once.
 *   Monthly cost = cost per mile × miles per month.
 * All-electric miles only: plug-in hybrids that also burn gasoline are not covered.
 */

import { epaCostPerMile, dashboardCostPerMile, epaPerMileRatio, dashboardPerMileRatio } from './per-mile.js';
import { roundRatio, multiplyRatio } from '../../lib/energy/money.js';

export const COST_LIMITS = Object.freeze({
  capacity: { min: 0.01, max: 10_000 },
  efficiency: { min: 1, max: 100 },
  rate: { min: 0, max: 10 },
  epa: { min: 1, max: 1000 },
  dashboard: { min: 0.1, max: 100 },
  miles: { min: 0, max: 1_000_000 }
});

export const HIGH_RATE = 1; // dollars per kWh
export const HIGH_MONTHLY = 100_000; // dollars

function range(name, value, { min, max }) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min || value > max) throw new RangeError(`${name} must be ${min} to ${max}`);
}

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} is too extreme to calculate`);
  return value;
}

/**
 * @param {object} input
 * @param {number} input.capacityKwh usable capacity
 * @param {number} input.startPercent
 * @param {number} input.targetPercent
 * @param {number} input.efficiencyPercent charging efficiency, 1–100
 * @param {number} input.rate dollars per kWh
 * @param {'epa' | 'dashboard' | null} [input.figureType]
 * @param {number | null} [input.figure] kWh/100 mi (EPA) or mi/kWh (dashboard)
 * @param {number | null} [input.milesPerMonth]
 */
export function calculateEvChargingCost({ capacityKwh, startPercent, targetPercent, efficiencyPercent, rate, figureType = null, figure = null, milesPerMonth = null }) {
  range('capacityKwh', capacityKwh, COST_LIMITS.capacity);
  range('startPercent', startPercent, { min: 0, max: 100 });
  range('targetPercent', targetPercent, { min: 0, max: 100 });
  if (targetPercent < startPercent) throw new RangeError('targetPercent cannot be below startPercent');
  range('efficiencyPercent', efficiencyPercent, COST_LIMITS.efficiency);
  range('rate', rate, COST_LIMITS.rate);
  if (figureType === null && (figure !== null || milesPerMonth !== null)) throw new RangeError('figureType is required with a figure or miles');

  const efficiency = efficiencyPercent / 100;
  const batteryKwh = finite('capacityKwh', (capacityKwh * (targetPercent - startPercent)) / 100);
  const meteredKwh = finite('efficiencyPercent', batteryKwh / efficiency);
  const result = {
    batteryKwh,
    meteredKwh,
    costPerCharge: finite('rate', (batteryKwh / efficiency) * rate),
    highRate: rate > HIGH_RATE,
    perMile: null
  };
  if (figureType === null) return result;

  if (figureType !== 'epa' && figureType !== 'dashboard') throw new RangeError('figureType must be epa or dashboard');
  range('figure', figure, COST_LIMITS[figureType]);
  const costPerMile = finite('figure', figureType === 'epa' ? epaCostPerMile(figure, rate) : dashboardCostPerMile(figure, efficiency, rate));
  // Displayed figures are rounded half up once from the exact value: hundredths of a cent per mile, and the
  // cost per 100 miles from those rounded cents, so the two never contradict.
  const ratio = figureType === 'epa' ? epaPerMileRatio(figure, rate) : dashboardPerMileRatio(figure, efficiencyPercent, rate);
  const costPerMileHundredthsOfCent = roundRatio(ratio, 4);
  let monthly = null;
  let monthlyCents = null;
  if (milesPerMonth !== null) {
    range('milesPerMonth', milesPerMonth, COST_LIMITS.miles);
    monthly = finite('milesPerMonth', costPerMile * milesPerMonth);
    monthlyCents = roundRatio(multiplyRatio(ratio, milesPerMonth), 2);
  }
  result.perMile = {
    costPerMile, costPer100Miles: costPerMile * 100, monthly, highMonthly: monthly !== null && monthly > HIGH_MONTHLY,
    costPerMileHundredthsOfCent, costPer100MilesCents: costPerMileHundredthsOfCent, monthlyCents
  };
  return result;
}
