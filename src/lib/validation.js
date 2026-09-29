/**
 * Shared parsing/validation for calculator form fields.
 * Returns user-facing messages; engines still validate their own inputs.
 */

/** Accepts "25,000", "$25,000.50", "6.5%", " 12 ". Returns NaN for anything else. */
export function parseNumber(rawValue) {
  if (typeof rawValue === 'number') return rawValue;
  const cleaned = String(rawValue ?? '').trim().replace(/[$,%\s]/g, '');
  if (cleaned === '' || !/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

function isBlank(rawValue) {
  return rawValue === undefined || rawValue === null || String(rawValue).trim() === '';
}

/**
 * Validate one numeric field.
 * rules: { label, required, fallback, min, minExclusive, max, integer }
 * label is the field name as it should start a sentence, e.g. "Loan amount".
 * Returns { value } or { error }.
 */
export function numberField(rawValue, rules) {
  const { label, required = true, fallback, min, minExclusive = false, max, integer = false } = rules;

  if (isBlank(rawValue)) {
    if (required) return { error: `${label} is required.` };
    return { value: fallback };
  }

  const value = parseNumber(rawValue);
  if (!Number.isFinite(value)) return { error: `${label} must be a number.` };
  if (integer && !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (min === 0 && !minExclusive && value < 0) return { error: `${label} cannot be negative.` };
  if (min !== undefined && (minExclusive ? value <= min : value < min)) {
    return { error: `${label} must be ${minExclusive ? 'greater than' : 'at least'} ${min.toLocaleString('en-US')}.` };
  }
  if (max !== undefined && value > max) {
    return { error: `${label} must be ${max.toLocaleString('en-US')} or less.` };
  }
  return { value };
}

/** Parse an optional <input type="month"> value ("2026-10"). */
export function monthField(rawValue, { label }) {
  if (isBlank(rawValue)) return { value: null };
  const match = /^(\d{4})-(\d{2})$/.exec(String(rawValue).trim());
  if (!match) return { error: `${label} must be a month like 2026-10.` };
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 1900 || year > 2200) {
    return { error: `${label} must be a valid month.` };
  }
  return { value: { year, month } };
}

/**
 * A loan term entered as a number plus a "years" or "months" unit.
 * Returns { value: termMonths } or { error }. Years must convert to whole months.
 */
export function termField(rawValue, rawUnit, { label = 'Loan term', maxMonths }) {
  const unit = rawUnit === 'months' ? 'months' : 'years';
  const result = numberField(rawValue, {
    label, min: 0, minExclusive: true,
    max: unit === 'years' ? maxMonths / 12 : maxMonths,
    integer: unit === 'months'
  });
  if (result.error) return result;
  const months = unit === 'years' ? result.value * 12 : result.value;
  const rounded = Math.round(months);
  if (Math.abs(months - rounded) > 1e-9) {
    return { error: `${label} in years must convert to whole months (for example 2.5 years).` };
  }
  return { value: rounded };
}
