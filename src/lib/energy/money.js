/**
 * Money inputs for the Home Energy calculators. A dollar amount is converted
 * once, from the text the user typed, to a whole number of cents, so every
 * comparison between amounts (down payment plus rebates against the price,
 * incentives against the cost) is exact integer arithmetic.
 *
 * Accepts the same text as parseNumber in ../validation.js ("$1,000", " 12 "),
 * and rejects anything with more than two decimal places.
 */

import { plainDecimal } from './format.js';

const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

/** Dollar text → { sign, whole, fraction } digits, or null when not a plain decimal. */
function splitDecimal(rawValue) {
  const cleaned = String(rawValue ?? '').trim().replace(/[$,%\s]/g, '');
  if (!NUMBER.test(cleaned)) return null;
  const negative = cleaned.startsWith('-');
  const [whole, fraction = ''] = (negative ? cleaned.slice(1) : cleaned).split('.');
  return { negative, whole: whole.replace(/^0+(?=\d)/, '') || '0', fraction };
}

/** Compare two non-negative digit strings as integers. */
function compareDigits(a, b) {
  const x = a.replace(/^0+/, '');
  const y = b.replace(/^0+/, '');
  if (x.length !== y.length) return x.length < y.length ? -1 : 1;
  return x === y ? 0 : (x < y ? -1 : 1);
}

/**
 * Validate one money field and convert it to cents.
 * rules: { label, required, min, max } with min and max in dollars.
 * Returns { value: cents } (a safe integer), { value: fallback } for a blank
 * optional field, or { error }.
 * @param {unknown} rawValue
 * @param {{ label: string, required?: boolean, fallback?: number | null, min?: number, max?: number }} rules
 * @returns {{ value?: number | null, error?: string }}
 */
export function moneyField(rawValue, { label, required = true, fallback = 0, min = 0, max }) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return required ? { error: `${label} is required.` } : { value: fallback };
  }
  const parts = splitDecimal(rawValue);
  if (!parts) return { error: `${label} must be a number.` };
  const isZero = /^0*$/.test(parts.whole + parts.fraction);
  if (parts.negative && !isZero) {
    return { error: min === 0 ? `${label} cannot be negative.` : `${label} must be at least ${min.toLocaleString('en-US')}.` };
  }
  // Compare the whole-dollar digits with the maximum before converting, so very long input never becomes a huge number.
  if (max !== undefined) {
    const maxWhole = String(Math.floor(max));
    const order = compareDigits(parts.whole, maxWhole);
    const overByFraction = order === 0 && /[1-9]/.test(parts.fraction) && Number.isInteger(max);
    if (order > 0 || overByFraction) return { error: `${label} must be ${max.toLocaleString('en-US')} or less.` };
  }
  if (parts.whole.length > 13) return { error: `${label} must be a smaller number.` };
  const fraction = parts.fraction.replace(/0+$/, '');
  if (fraction.length > 2) return { error: 'Enter dollars and cents, for example 1.25.' };
  const cents = Number(parts.whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents < Math.round(min * 100)) return { error: `${label} must be at least ${min.toLocaleString('en-US')}.` };
  if (max !== undefined && cents > Math.round(max * 100)) return { error: `${label} must be ${max.toLocaleString('en-US')} or less.` };
  return { value: cents };
}

/** A non-negative number's shortest decimal form as an integer and a count of decimal places. */
function scaledDigits(x) {
  const [whole, fraction = ''] = plainDecimal(x).split('.');
  return { digits: BigInt(whole + fraction), places: fraction.length };
}

/**
 * x × y dollars in whole cents, rounded half up, computed exactly from the
 * shortest decimal form of each factor. Binary multiplication can land just
 * below a half cent (3 × 0.145 = 0.43499999999999994), which would display
 * one cent low; the exact product is 0.435 and rounds to $0.44.
 * Both factors must be finite and non-negative.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function productCents(x, y) {
  const a = scaledDigits(x);
  const b = scaledDigits(y);
  const numerator = a.digits * b.digits * 100n;
  const denominator = 10n ** BigInt(a.places + b.places);
  return Number((2n * numerator + denominator) / (2n * denominator));
}

/**
 * Whole cents ÷ a positive whole number, rounded half up to whole cents.
 * @param {number} cents
 * @param {number} divisor
 * @returns {number}
 */
export function divideCents(cents, divisor) {
  const c = BigInt(cents);
  const d = BigInt(divisor);
  return Number((2n * c + d) / (2n * d));
}

/**
 * The exact product of several non-negative factors ÷ a positive whole
 * number, in whole cents rounded half up, from the shortest decimal form of
 * each factor: 125 W × 24 h × 1 day × $0.145 ÷ 1,000 = $0.435 → 44 cents.
 * @param {number[]} factors finite, non-negative
 * @param {number} [divisor] a positive whole number
 * @returns {number}
 */
export function productCentsOf(factors, divisor = 1) {
  let digits = 1n;
  let places = 0;
  for (const factor of factors) {
    const scaled = scaledDigits(factor);
    digits *= scaled.digits;
    places += scaled.places;
  }
  const numerator = digits * 100n;
  const denominator = 10n ** BigInt(places) * BigInt(divisor);
  return Number((2n * numerator + denominator) / (2n * denominator));
}
