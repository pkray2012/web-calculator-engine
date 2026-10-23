/**
 * An electric vehicle's electricity cost per mile, from one of two figures.
 *
 * - EPA label kWh per 100 miles: cost per mile = kWh/100 mi ÷ 100 × rate.
 *   The label is based on the electricity drawn from the outlet, so it already includes charging
 *   losses; no charging efficiency is applied. Miles per kWh = 100 ÷ kWh/100 mi.
 * - Trip-computer miles per kWh: cost per mile = rate ÷ (mi/kWh × efficiency).
 *   The figure is used as the vehicle reports it, and the charging efficiency
 *   the user enters is applied once; where the vehicle measures it is not
 *   assumed.
 * Cost per 100 miles = cost per mile × 100; yearly cost = cost per mile ×
 * miles per year (optional). All-electric miles only.
 * Displayed figures are rounded half up once from the exact value (hundredths
 * of a cent per mile; the cost per 100 miles from those rounded cents, so the
 * two never contradict; yearly cost in whole cents).
 */

import { epaCostPerMile, dashboardCostPerMile, epaPerMileRatio, dashboardPerMileRatio } from './per-mile.js';
import { roundRatio, multiplyRatio } from '../../lib/energy/money.js';

export const PER_MILE_LIMITS = Object.freeze({
  rate: { min: 0, max: 10 },
  epa: { min: 1, max: 1000 },
  dashboard: { min: 0.1, max: 100 },
  efficiency: { min: 1, max: 100 },
  miles: { min: 0, max: 1_000_000 }
});

export const HIGH_RATE = 1; // dollars per kWh

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
 * @param {number} input.rate dollars per kWh
 * @param {'epa' | 'dashboard'} input.figureType
 * @param {number} input.figure kWh/100 mi (EPA) or mi/kWh (dashboard)
 * @param {number | null} [input.efficiencyPercent] charging efficiency, dashboard figure only
 * @param {number | null} [input.annualMiles]
 */
export function calculateEvCostPerMile({ rate, figureType, figure, efficiencyPercent = null, annualMiles = null }) {
  range('rate', rate, PER_MILE_LIMITS.rate);
  if (figureType !== 'epa' && figureType !== 'dashboard') throw new RangeError('figureType must be epa or dashboard');
  range('figure', figure, PER_MILE_LIMITS[figureType]);
  let costPerMile;
  let ratio;
  let milesPerKwh = null;
  if (figureType === 'epa') {
    if (efficiencyPercent !== null) throw new RangeError('efficiency is not used with the EPA figure');
    costPerMile = finite('figure', epaCostPerMile(figure, rate));
    ratio = epaPerMileRatio(figure, rate);
    milesPerKwh = 100 / figure;
  } else {
    if (efficiencyPercent === null) throw new RangeError('efficiency is required with a trip-computer figure');
    range('efficiencyPercent', efficiencyPercent, PER_MILE_LIMITS.efficiency);
    costPerMile = finite('figure', dashboardCostPerMile(figure, efficiencyPercent / 100, rate));
    ratio = dashboardPerMileRatio(figure, efficiencyPercent, rate);
  }
  const costPerMileHundredthsOfCent = roundRatio(ratio, 4);
  let annual = null;
  let annualCents = null;
  if (annualMiles !== null) {
    range('annualMiles', annualMiles, PER_MILE_LIMITS.miles);
    annual = finite('annualMiles', costPerMile * annualMiles);
    annualCents = roundRatio(multiplyRatio(ratio, annualMiles), 2);
  }
  return {
    costPerMile, costPer100Miles: costPerMile * 100, milesPerKwh, annual, highRate: rate > HIGH_RATE,
    costPerMileHundredthsOfCent, costPer100MilesCents: costPerMileHundredthsOfCent, annualCents
  };
}
