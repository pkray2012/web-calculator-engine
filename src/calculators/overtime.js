/**
 * Overtime pay for one workweek from the hours worked each day, under the
 * federal rule or California's daily rules.
 *
 * Federal (Fair Labor Standards Act): hours over 40 in the workweek are paid
 * at 1.5 × the regular rate (or a higher multiplier the employer uses).
 *
 * California (Labor Code 510, DLSE overtime FAQ):
 * - 1.5 × for hours over 8 and up to 12 in a workday, and for the first 8
 *   hours on the seventh consecutive day of work in the workweek;
 * - 2 × for hours over 12 in a workday and over 8 on the seventh consecutive day;
 * - 1.5 × for regular hours over 40 in the workweek. Hours already paid as
 *   daily overtime do not count again toward the 40.
 *
 * The seventh-day rule applies when all seven days of the workweek are worked.
 */

export const RULES = Object.freeze({ federal: 'Federal (over 40 hours a week)', california: 'California (daily and weekly)' });
export const WEEKLY_THRESHOLD = 40;
export const DAILY_THRESHOLD = 8;
export const DAILY_DOUBLE_THRESHOLD = 12;

function check(name, value, { min = 0, max = Infinity } = {}) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min) throw new RangeError(`${name} must be at least ${min}`);
  if (value > max) throw new RangeError(`${name} must be at most ${max}`);
}

/** Split each day's hours into regular, overtime and double time under California rules. */
function californiaDays(hours) {
  const seventhDay = hours.every((h) => h > 0);
  return hours.map((h, index) => {
    if (seventhDay && index === 6) {
      return { regular: 0, overtime: Math.min(h, DAILY_THRESHOLD), doubleTime: Math.max(h - DAILY_THRESHOLD, 0), seventhDay: true };
    }
    return {
      regular: Math.min(h, DAILY_THRESHOLD),
      overtime: Math.min(Math.max(h - DAILY_THRESHOLD, 0), DAILY_DOUBLE_THRESHOLD - DAILY_THRESHOLD),
      doubleTime: Math.max(h - DAILY_DOUBLE_THRESHOLD, 0),
      seventhDay: false
    };
  });
}

/**
 * @param {object} input
 * @param {number} input.hourlyRate regular rate of pay
 * @param {number[]} input.hours hours worked on each of the 7 days of the workweek, first day first
 * @param {'federal'|'california'} [input.rule]
 * @param {number} [input.overtimeMultiplier] federal rule only; at least 1.5
 */
export function weeklyOvertime({ hourlyRate, hours, rule = 'federal', overtimeMultiplier = 1.5 }) {
  check('hourlyRate', hourlyRate, { max: 10_000 });
  if (!Array.isArray(hours) || hours.length !== 7) throw new RangeError('hours must list the 7 days of the workweek');
  hours.forEach((h, i) => check(`hours[${i}]`, h, { max: 24 }));
  if (!Object.hasOwn(RULES, rule)) throw new RangeError(`unknown rule: ${rule}`);
  check('overtimeMultiplier', overtimeMultiplier, { min: 1.5, max: 3 });

  const totalHours = hours.reduce((sum, h) => sum + h, 0);
  let days;
  if (rule === 'federal') {
    // Weekly threshold only: the hours past 40 are the last ones worked.
    let cumulative = 0;
    days = hours.map((h) => {
      const regular = Math.max(Math.min(h, WEEKLY_THRESHOLD - cumulative), 0);
      cumulative += h;
      return { regular, overtime: h - regular, doubleTime: 0, seventhDay: false };
    });
  } else {
    days = californiaDays(hours);
    // Weekly rule: regular hours beyond 40 in the week become overtime.
    let cumulativeRegular = 0;
    for (const day of days) {
      const allowed = Math.max(WEEKLY_THRESHOLD - cumulativeRegular, 0);
      const moved = Math.max(day.regular - allowed, 0);
      cumulativeRegular += day.regular;
      day.regular -= moved;
      day.overtime += moved;
      day.weeklyOvertime = moved;
    }
  }

  const sum = (key) => days.reduce((total, day) => total + day[key], 0);
  const regularHours = sum('regular');
  const overtimeHours = sum('overtime');
  const doubleTimeHours = sum('doubleTime');
  const otMultiplier = rule === 'federal' ? overtimeMultiplier : 1.5;
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * otMultiplier;
  const doubleTimePay = doubleTimeHours * hourlyRate * 2;
  const totalPay = regularPay + overtimePay + doubleTimePay;
  return {
    days,
    totalHours,
    regularHours,
    overtimeHours,
    doubleTimeHours,
    overtimeRate: hourlyRate * otMultiplier,
    doubleTimeRate: hourlyRate * 2,
    regularPay,
    overtimePay,
    doubleTimePay,
    totalPay,
    // What overtime adds over paying every hour at the regular rate.
    overtimePremium: totalPay - totalHours * hourlyRate,
    averageHourly: totalHours > 0 ? totalPay / totalHours : 0,
    seventhDayApplied: days.some((day) => day.seventhDay)
  };
}
