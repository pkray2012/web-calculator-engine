/**
 * A year's fuel cost of an electric vehicle against a gas vehicle.
 *
 * - Electricity cost = miles × EPA kWh per 100 miles ÷ 100 × rate per kWh.
 *   The EPA figure is measured at the wall, so it already includes charging
 *   losses; no charging efficiency is applied.
 * - Gas cost = miles ÷ MPG × price per gallon, from the site's Fuel Cost
 *   engine (calculateTripFuelCost), used unchanged.
 * - Savings = gas cost − electricity cost (negative when gas is cheaper);
 *   per month = savings ÷ 12. Cost per mile for each side.
 * Fuel only: purchase price, maintenance, insurance and incentives are not
 * included. All-electric miles only.
 */

import { calculateTripFuelCost } from '../fuel-cost.js';

export const SAVINGS_LIMITS = Object.freeze({
  miles: { max: 1_000_000 },
  epa: { min: 1, max: 1000 },
  rate: { min: 0, max: 10 },
  mpg: { max: 500 },
  pricePerGallon: { max: 50 }
});

export const HIGH_RATE = 1; // dollars per kWh

/** A result that cannot be calculated from the input named by field. */
export class SavingsError extends RangeError {
  /** @param {string} field @param {string} message */
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

function positive(field, value, max) {
  if (!Number.isFinite(value) || value <= 0 || value > max) throw new SavingsError(field, `${field} must be greater than 0 and at most ${max}`);
}

function range(field, value, { min, max }) {
  if (!Number.isFinite(value) || value < min || value > max) throw new SavingsError(field, `${field} must be ${min} to ${max}`);
}

function finite(field, value, message) {
  if (!Number.isFinite(value)) throw new SavingsError(field, message);
  return value;
}

/**
 * @param {object} input
 * @param {number} input.miles miles per year, greater than 0
 * @param {number} input.kwhPer100Miles EPA label kWh per 100 miles
 * @param {number} input.rate dollars per kWh
 * @param {number} input.mpg the gas vehicle's miles per gallon
 * @param {number} input.pricePerGallon
 */
export function calculateEvGasSavings({ miles, kwhPer100Miles, rate, mpg, pricePerGallon }) {
  const L = SAVINGS_LIMITS;
  // Checked here so the Fuel Cost engine, which throws for 0, is never called with it.
  positive('miles', miles, L.miles.max);
  range('kwhPer100Miles', kwhPer100Miles, L.epa);
  range('rate', rate, L.rate);
  positive('mpg', mpg, L.mpg.max);
  positive('pricePerGallon', pricePerGallon, L.pricePerGallon.max);

  const evPerMile = (kwhPer100Miles / 100) * rate;
  const evCost = finite('miles', miles * evPerMile, 'Miles per year is too large to calculate.');
  const gas = calculateTripFuelCost({ distanceMiles: miles, mpg, pricePerGallon });
  const gasCost = finite('mpg', gas.cost, 'Fuel economy is too small to calculate.');
  finite('mpg', gas.gallons, 'Fuel economy is too small to calculate.');
  const gasPerMile = finite('mpg', gas.costPerMile, 'Fuel economy is too small to calculate.');
  const savings = gasCost - evCost;
  return {
    evCost,
    gasCost,
    gallons: gas.gallons,
    savings,
    savingsPerMonth: savings / 12,
    evPerMile,
    gasPerMile,
    gasCheaper: savings < 0,
    highRate: rate > HIGH_RATE
  };
}
