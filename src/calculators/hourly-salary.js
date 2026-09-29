/**
 * Hourly to salary (and back): converts pay quoted per hour, day, week,
 * two weeks, half month, month or year into every other period.
 *
 * - A work schedule (hours a week, days a week, paid weeks a year) links the
 *   hourly, daily and weekly figures to the annual one:
 *   annual = hourly rate × (regular hours + overtime hours × multiplier) × paid weeks.
 * - Pay-period amounts (biweekly, semimonthly, monthly, annual) are shares of
 *   the annual figure: 26, 24 and 12 paychecks a year. With fewer than 52 paid
 *   weeks they are averages across the year.
 * - Optional overtime hours each week are paid at a multiple of the regular
 *   rate (1.5 by default, the federal Fair Labor Standards Act minimum for
 *   covered non-exempt employees).
 * - Optional paid days off (vacation and holidays) do not change pay; they
 *   lower the hours actually worked, giving an effective rate per hour worked.
 * - All figures are gross, before taxes and deductions.
 */

export const PAY_PERIODS = Object.freeze({
  hour: { label: 'Hourly', per: 'an hour' },
  day: { label: 'Daily', per: 'a day' },
  week: { label: 'Weekly', per: 'a week' },
  biweek: { label: 'Biweekly', per: 'every two weeks' },
  semimonth: { label: 'Semimonthly', per: 'twice a month' },
  month: { label: 'Monthly', per: 'a month' },
  year: { label: 'Annual', per: 'a year' }
});

/** Paychecks a year for the salary-style periods. */
const PER_YEAR = Object.freeze({ biweek: 26, semimonth: 24, month: 12, year: 1 });

function check(name, value, { min = 0, max = Infinity, minExclusive = false } = {}) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (minExclusive ? value <= min : value < min) throw new RangeError(`${name} must be ${minExclusive ? 'greater than' : 'at least'} ${min}`);
  if (value > max) throw new RangeError(`${name} must be at most ${max}`);
}

/**
 * @param {object} input
 * @param {number} input.amount pay for one `period`
 * @param {keyof typeof PAY_PERIODS} input.period
 * @param {number} [input.hoursPerWeek] regular hours a week
 * @param {number} [input.daysPerWeek]
 * @param {number} [input.weeksPerYear] paid weeks a year
 * @param {number} [input.overtimeHours] overtime hours a week
 * @param {number} [input.overtimeMultiplier]
 * @param {number} [input.paidDaysOff] paid vacation and holiday days a year
 */
export function convertPay({ amount, period, hoursPerWeek = 40, daysPerWeek = 5, weeksPerYear = 52, overtimeHours = 0, overtimeMultiplier = 1.5, paidDaysOff = 0 }) {
  if (!Object.hasOwn(PAY_PERIODS, period)) throw new RangeError(`unknown pay period: ${period}`);
  check('amount', amount);
  check('hoursPerWeek', hoursPerWeek, { min: 0, minExclusive: true, max: 168 });
  check('daysPerWeek', daysPerWeek, { min: 1, max: 7 });
  check('weeksPerYear', weeksPerYear, { min: 0, minExclusive: true, max: 52 });
  check('overtimeHours', overtimeHours, { max: 168 - hoursPerWeek });
  check('overtimeMultiplier', overtimeMultiplier, { min: 1, max: 5 });
  check('paidDaysOff', paidDaysOff);

  // Pay-equivalent hours in a week: overtime hours count `multiplier` times.
  const weightedHours = hoursPerWeek + overtimeHours * overtimeMultiplier;
  let annual;
  if (period === 'hour') annual = amount * weightedHours * weeksPerYear;
  else if (period === 'day') annual = amount * daysPerWeek * weeksPerYear;
  else if (period === 'week') annual = amount * weeksPerYear;
  else annual = amount * PER_YEAR[period];

  const weekly = annual / weeksPerYear;
  const hourly = weekly / weightedHours;
  const hoursPerYear = (hoursPerWeek + overtimeHours) * weeksPerYear;
  const hoursOff = paidDaysOff * (hoursPerWeek / daysPerWeek);
  if (hoursOff >= hoursPerYear) throw new RangeError('paid days off must be fewer than the days worked in a year');
  const hoursWorked = hoursPerYear - hoursOff;

  return {
    pay: {
      hour: hourly,
      day: weekly / daysPerWeek,
      week: weekly,
      biweek: annual / 26,
      semimonth: annual / 24,
      month: annual / 12,
      year: annual
    },
    overtimePay: overtimeHours > 0 ? hourly * overtimeMultiplier * overtimeHours * weeksPerYear : 0,
    hoursPerYear,
    hoursWorked,
    /** Annual pay ÷ hours actually worked, after paid days off. */
    effectiveHourly: annual / hoursWorked
  };
}
