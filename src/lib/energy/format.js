/**
 * Display rounding for the Home Energy calculators. Every helper rounds half
 * away from zero on the shortest decimal form of the number (the digits
 * String(x) shows), so 0.0445 shows as 0.045, not 0.044 as toFixed would give.
 * A result that rounds to zero never shows a minus sign.
 */

/** Shortest decimal digits of a finite number as plain text (no exponent). */
export function plainDecimal(x) {
  const text = String(x);
  if (!/e/i.test(text)) return text;
  const [mantissa, exponentText] = text.toLowerCase().split('e');
  const negative = mantissa.startsWith('-');
  const [whole, fraction = ''] = (negative ? mantissa.slice(1) : mantissa).split('.');
  const digits = whole + fraction;
  const point = whole.length + Number(exponentText);
  let plain;
  if (point <= 0) plain = `0.${'0'.repeat(-point)}${digits}`;
  else if (point >= digits.length) plain = digits + '0'.repeat(point - digits.length);
  else plain = `${digits.slice(0, point)}.${digits.slice(point)}`;
  return (negative ? '-' : '') + plain;
}

const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Move the decimal point of plain decimal text: shiftDecimal('0.0445', 2) → '4.45'. */
function shiftDecimal(text, places) {
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = (negative ? text.slice(1) : text).split('.');
  const digits = whole + fraction;
  const point = whole.length + places;
  let shifted;
  if (point <= 0) shifted = `0.${'0'.repeat(-point)}${digits}`;
  else if (point >= digits.length) shifted = digits + '0'.repeat(point - digits.length);
  else shifted = `${digits.slice(0, point)}.${digits.slice(point)}`;
  return (negative ? '-' : '') + shifted;
}

/**
 * Round x to dp decimals, half away from zero on its shortest decimal form.
 * shift moves the decimal point first, exactly (2 turns dollars into cents).
 * Returns text with dp decimals; grouped with commas when grouping is true.
 */
export function roundHalfUp(x, dp, { grouping = true, shift = 0 } = {}) {
  if (!Number.isFinite(x)) throw new RangeError('value must be a finite number');
  const text = shiftDecimal(plainDecimal(x), shift);
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = (negative ? text.slice(1) : text).split('.');
  const padded = fraction.padEnd(dp + 1, '0');
  let scaled = BigInt(whole + padded.slice(0, dp));
  if (padded[dp] >= '5') scaled += 1n;
  const digits = scaled.toString().padStart(dp + 1, '0');
  const intPart = digits.slice(0, digits.length - dp);
  const fracPart = digits.slice(digits.length - dp);
  const body = (grouping ? group(intPart) : intPart) + (dp ? `.${fracPart}` : '');
  return negative && scaled !== 0n ? `-${body}` : body;
}

/** Percentage share with one decimal and a trailing zero: 100 → "100.0%". */
export const formatShare = (percent) => `${roundHalfUp(percent, 1, { grouping: false })}%`;

/** Energy in kWh: "45.00 kWh"; under 0.005 kWh (but not zero) → "less than 0.01 kWh". */
export function formatKwh(kwh) {
  if (kwh === 0) return '0.00 kWh';
  if (kwh < 0) return `${roundHalfUp(kwh, 2)} kWh`;
  if (kwh < 0.005) return 'less than 0.01 kWh';
  return `${roundHalfUp(kwh, 2)} kWh`;
}

/** Whole minutes, rounded half up: floor(hours × 60 + 0.5). */
export const roundMinutes = (hours) => Math.floor(hours * 60 + 0.5);

/**
 * A duration in hours as "4 h 40 min" or "40 min", with days added from 48 hours:
 * "50 h 0 min (2.08 days)".
 */
export function formatHours(hours) {
  if (hours === 0) return '0 min';
  if (hours * 60 < 0.5) return 'less than 1 min';
  const minutes = roundMinutes(hours);
  const text = minutes < 60 ? `${minutes} min` : `${group(String(Math.floor(minutes / 60)))} h ${minutes % 60} min`;
  return hours >= 48 ? `${text} (${roundHalfUp(hours / 24, 2)} days)` : text;
}

/**
 * Cost per unit in cents with the dollar figure from the rounded cents:
 * "4.45¢ ($0.045)", grouped from 1,000¢ ("10,000.00¢ ($100.000)"), with the
 * sign in front of each figure for a negative amount ("-4.45¢ (-$0.045)").
 */
export function formatCentsAndDollars(dollars) {
  const cents = roundHalfUp(Math.abs(dollars), 2, { grouping: false, shift: 2 });
  const sign = dollars < 0 && /[1-9]/.test(cents) ? '-' : '';
  return `${sign}${roundHalfUp(Number(cents), 2)}¢ (${sign}$${roundHalfUp(Number(cents), 3, { shift: -2 })})`;
}

/**
 * The same display from an exact count of hundredths of a cent (already
 * rounded half up once, see roundRatio in ./money.js): 445 → "4.45¢ ($0.045)".
 * The dollar figure is the rounded cents rounded half up to 3 decimals.
 * @param {number} hundredthsOfCent a non-negative whole number
 */
export function formatPerMile(hundredthsOfCent) {
  const x = BigInt(hundredthsOfCent);
  const thousandthsOfDollar = (x + 5n) / 10n;
  const cents = `${x / 100n}.${String(x % 100n).padStart(2, '0')}`;
  const dollars = `${thousandthsOfDollar / 1000n}.${String(thousandthsOfDollar % 1000n).padStart(3, '0')}`;
  return `${roundHalfUp(Number(cents), 2)}¢ ($${roundHalfUp(Number(dollars), 3)})`;
}
