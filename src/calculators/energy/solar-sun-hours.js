/**
 * The peak-sun-hours and system-losses convention shared by the Solar Panel
 * Size (B1-19) and Solar Panel Output (B1-20) drafts. Both values are the
 * user's own (from a solar resource map, the installer or a design tool);
 * neither has a default or a typical value here.
 *
 * - Usable fraction = 1 − losses ÷ 100, kept above 0 by the 99 % maximum.
 * - A year is 365 days (a stated convention).
 */

import { exactRatio, subtractRatios } from '../../lib/energy/money.js';

export const SUN_LIMITS = Object.freeze({
  sunHours: { min: 0.1, max: 24 },
  losses: { min: 0, max: 99 }
});

export const DAYS_PER_YEAR = 365;
export const HIGH_LOSSES = 50; // percent; at or above this the page asks the user to check the value

export function range(name, value, { min, max }) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min || value > max) throw new RangeError(`${name} must be ${min} to ${max}`);
}

export function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} is too extreme to calculate`);
  return value;
}

export function checkSunAndLosses(sunHours, losses) {
  range('sunHours', sunHours, SUN_LIMITS.sunHours);
  range('losses', losses, SUN_LIMITS.losses);
}

/** 1 − losses ÷ 100 as a number. */
export const usableFraction = (losses) => 1 - losses / 100;

/** 1 − losses ÷ 100, exactly, from the decimal as entered. */
export const usableFractionRatio = (losses) => subtractRatios({ n: 1n, d: 1n }, exactRatio([losses], [100]));
