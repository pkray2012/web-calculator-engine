/**
 * Cost to run an appliance from its power, hours of use and your rate.
 *
 * - Energy per day (kWh) = watts × hours used per day ÷ 1,000.
 * - Energy (kWh) = energy per day × days.
 * - Cost = energy × rate per kWh; cost per day = cost ÷ days.
 * Nameplate watts are a maximum, so appliances that cycle on and off use
 * less. One flat rate; tiered and time-of-use rates are not modeled.
 *
 * The displayed cost comes from exact whole cents (costCents): the product
 * watts × hours × days × rate ÷ 1,000 is computed from the decimals as
 * entered and rounded half up once, so an exact half cent is never shown one
 * cent low (3 kWh × $0.145 = $0.44).
 */

import { productCentsOf, divideCents } from '../../lib/energy/money.js';

export const COST_LIMITS = Object.freeze({
  watts: { min: 0.01, max: 1_000_000 },
  hours: { min: 0, max: 24 },
  days: { min: 1, max: 366 },
  rate: { min: 0, max: 10 }
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
 * @param {number} input.watts power while running, in watts
 * @param {number} input.hours hours used per day
 * @param {number} input.days number of days
 * @param {number} input.rate dollars per kWh
 */
export function calculateElectricityCost({ watts, hours, days, rate }) {
  range('watts', watts, COST_LIMITS.watts);
  range('hours', hours, COST_LIMITS.hours);
  range('days', days, COST_LIMITS.days);
  if (!Number.isInteger(days)) throw new RangeError('days must be a whole number');
  range('rate', rate, COST_LIMITS.rate);

  const kwhPerDay = finite('watts', (watts * hours) / 1000);
  const kwh = finite('days', kwhPerDay * days);
  const cost = finite('rate', kwh * rate);
  const costCents = productCentsOf([watts, hours, days, rate], 1000);
  return {
    kwhPerDay,
    kwh,
    cost,
    costPerDay: cost / days,
    costCents,
    costPerDayCents: divideCents(costCents, days),
    highRate: rate > HIGH_RATE
  };
}
