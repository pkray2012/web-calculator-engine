/**
 * An electric vehicle's electricity cost per mile, from one of two figures.
 *
 * - EPA label kWh per 100 miles: cost per mile = kWh/100 mi ÷ 100 × rate.
 *   The label is measured at the wall, so it already includes charging
 *   losses; no charging efficiency is applied. Miles per kWh = 100 ÷ kWh/100 mi.
 * - Dashboard miles per kWh: cost per mile = rate ÷ (mi/kWh × efficiency).
 *   The figure is treated as energy from the battery, so the charging
 *   efficiency is applied once.
 * Cost per 100 miles = cost per mile × 100; yearly cost = cost per mile ×
 * miles per year (optional). All-electric miles only.
 */

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
  let milesPerKwh = null;
  if (figureType === 'epa') {
    if (efficiencyPercent !== null) throw new RangeError('efficiency is not used with the EPA figure');
    costPerMile = finite('figure', (figure / 100) * rate);
    milesPerKwh = 100 / figure;
  } else {
    if (efficiencyPercent === null) throw new RangeError('efficiency is required with a dashboard figure');
    range('efficiencyPercent', efficiencyPercent, PER_MILE_LIMITS.efficiency);
    costPerMile = finite('figure', rate / (figure * (efficiencyPercent / 100)));
  }
  let annual = null;
  if (annualMiles !== null) {
    range('annualMiles', annualMiles, PER_MILE_LIMITS.miles);
    annual = finite('annualMiles', costPerMile * annualMiles);
  }
  return { costPerMile, costPer100Miles: costPerMile * 100, milesPerKwh, annual, highRate: rate > HIGH_RATE };
}
