/**
 * US display formatting. Calculation engines keep full precision;
 * rounding happens only here, at presentation time.
 */

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const count = new Intl.NumberFormat('en-US');

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export function formatCurrency(value) {
  // Avoid "-$0.00" from floating-point residue.
  return usd.format(Math.abs(value) < 0.005 ? 0 : value);
}

export function formatCurrencyWhole(value) {
  return usdWhole.format(Math.abs(value) < 0.5 ? 0 : value);
}

export function formatCount(value) {
  return count.format(value);
}

export function formatPercent(value, digits = 2) {
  return `${Number(value.toFixed(digits))}%`;
}

/** 67 → "5 years, 7 months"; 12 → "1 year"; 5 → "5 months". */
export function formatDuration(months) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (rest || !years) parts.push(`${rest} ${rest === 1 ? 'month' : 'months'}`);
  return parts.join(', ');
}

/**
 * Month of the Nth payment given the first payment month.
 * start is { year, month } with month 1–12; paymentNumber is 1-based.
 */
export function paymentMonth(start, paymentNumber) {
  const index = start.year * 12 + (start.month - 1) + (paymentNumber - 1);
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function formatMonth({ year, month }) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatMonthShort({ year, month }) {
  return `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`;
}
