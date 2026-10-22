/**
 * Electric bill estimate from usage, a flat energy rate and fixed charges.
 *
 * - Bill = kWh used × rate per kWh + fixed charges.
 * - Daily cost = bill ÷ days in the billing period (fixed charges included).
 * - Average cents per kWh = bill ÷ kWh × 100, shown only from 1 kWh, because
 *   fixed charges spread over almost no usage give a meaningless average.
 * - 12 × this bill is shown for budgeting; it is not a forecast.
 * Tiered and time-of-use rates, riders and taxes are not modeled; fixed
 * charges are whatever the user enters.
 *
 * The displayed amounts come from exact whole cents (billCents and the others):
 * the energy charge is computed from the decimals as entered and rounded half
 * up once, so an exact half cent is never shown one cent low.
 */

import { productCents, divideCents } from '../../lib/energy/money.js';

export const LIMITS = Object.freeze({ maxKwh: 10_000_000, maxRate: 10, maxFixedCents: 100_000_000, maxDays: 366 });

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  return value;
}

/**
 * @param {object} input
 * @param {number} input.kwh electricity used in the billing period
 * @param {number} input.rate dollars per kWh
 * @param {number} [input.fixedCents] fixed charges for the period, in whole cents
 * @param {number} [input.days] days in the billing period
 */
export function calculateElectricBill({ kwh, rate, fixedCents = 0, days = 30 }) {
  finite('kwh', kwh);
  finite('rate', rate);
  if (kwh < 0 || kwh > LIMITS.maxKwh) throw new RangeError(`kwh must be 0 to ${LIMITS.maxKwh}`);
  if (rate < 0 || rate > LIMITS.maxRate) throw new RangeError(`rate must be 0 to ${LIMITS.maxRate} dollars per kWh`);
  if (!Number.isSafeInteger(fixedCents) || fixedCents < 0 || fixedCents > LIMITS.maxFixedCents) throw new RangeError('fixedCents out of range');
  if (!Number.isInteger(days) || days < 1 || days > LIMITS.maxDays) throw new RangeError('days must be a whole number from 1 to 366');

  const bill = finite('bill', kwh * rate + fixedCents / 100);
  const energyCents = productCents(kwh, rate);
  const billCents = energyCents + fixedCents;
  return {
    bill,
    energyCharge: kwh * rate,
    fixed: fixedCents / 100,
    daily: bill / days,
    averageCentsPerKwh: kwh >= 1 ? (bill / kwh) * 100 : null,
    twelveTimesBill: bill * 12,
    highRate: rate > 1,
    energyCents,
    billCents,
    dailyCents: divideCents(billCents, days),
    twelveTimesBillCents: billCents * 12
  };
}
