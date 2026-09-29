/**
 * Time card: hours worked per day from start and end times less unpaid
 * breaks, the weekly total split into regular and overtime hours, and pay.
 *
 * - A shift whose end time is not after its start time is taken to end the
 *   next day (an overnight shift), so 22:00 to 06:00 is 8 hours.
 * - Overtime is the time worked beyond a weekly threshold, 40 hours by default,
 *   the federal Fair Labor Standards Act rule for covered non-exempt
 *   employees, paid at a multiple of the regular rate (1.5 by default).
 *   Daily overtime rules that some states add are not modeled.
 * - All arithmetic is in whole minutes, so totals are exact.
 */

const MINUTES_PER_DAY = 24 * 60;

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/** Worked minutes for one shift. start and end are minutes after midnight. */
export function shiftMinutes({ start, end, breakMinutes = 0 }) {
  for (const [name, value] of Object.entries({ start, end })) {
    if (!Number.isInteger(value) || value < 0 || value >= MINUTES_PER_DAY) throw new RangeError(`${name} must be a time of day in whole minutes`);
  }
  nonNegative('breakMinutes', breakMinutes);
  const overnight = end <= start;
  const span = overnight ? end + MINUTES_PER_DAY - start : end - start;
  if (breakMinutes >= span) throw new RangeError('the break must be shorter than the shift');
  return { span, worked: span - breakMinutes, overnight };
}

/**
 * @param {object} input
 * @param {Array<{ start: number, end: number, breakMinutes?: number } | null>} input.days
 * @param {number} [input.overtimeAfterHours] weekly hours before overtime
 * @param {number} [input.hourlyRate]
 * @param {number} [input.overtimeMultiplier]
 */
export function calculateTimeCard({ days, overtimeAfterHours = 40, hourlyRate = 0, overtimeMultiplier = 1.5 }) {
  if (!Array.isArray(days) || !days.some(Boolean)) throw new RangeError('enter at least one shift');
  nonNegative('overtimeAfterHours', overtimeAfterHours);
  nonNegative('hourlyRate', hourlyRate);
  nonNegative('overtimeMultiplier', overtimeMultiplier);
  if (overtimeMultiplier < 1) throw new RangeError('overtimeMultiplier must be at least 1');

  const perDay = days.map((day) => (day ? shiftMinutes(day) : null));
  const totalMinutes = perDay.reduce((sum, day) => sum + (day ? day.worked : 0), 0);
  const thresholdMinutes = Math.round(overtimeAfterHours * 60);
  const regularMinutes = Math.min(totalMinutes, thresholdMinutes);
  const overtimeMinutes = totalMinutes - regularMinutes;
  const regularPay = regularMinutes / 60 * hourlyRate;
  const overtimePay = overtimeMinutes / 60 * hourlyRate * overtimeMultiplier;
  return {
    perDay,
    totalMinutes,
    regularMinutes,
    overtimeMinutes,
    daysWorked: perDay.filter(Boolean).length,
    pay: hourlyRate > 0 ? { regular: regularPay, overtime: overtimePay, total: regularPay + overtimePay } : null
  };
}

/** 525 → "8:45"; minutes as hours:minutes. */
export const hoursAndMinutes = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
/** 525 → 8.75; minutes as decimal hours for payroll. */
export const decimalHours = (minutes) => minutes / 60;
