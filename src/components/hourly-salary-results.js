/**
 * Results panel for the Hourly to Salary Calculator. Pure function of the
 * view model from src/adapters/hourly-salary.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';
import { PAY_PERIODS } from '../calculators/hourly-salary.js';

const PERIOD_NOTES = Object.freeze({
  hour: 'Regular rate',
  day: 'A day worked',
  week: 'A week worked',
  biweek: '26 paychecks a year',
  semimonth: '24 paychecks a year',
  month: '12 a year',
  year: 'Before taxes'
});

const count = (value) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
// Hourly and daily pay lead with the annual salary; salaries and paychecks lead with the hourly rate.
const primaryPeriod = (view) => (['hour', 'day'].includes(view.input.period) ? 'year' : 'hour');

export function hourlySalaryResults(view) {
  const { input, pay } = view;
  const primary = primaryPeriod(view);
  const secondary = ['year', 'month', 'biweek', 'hour'].filter((period) => period !== primary && period !== input.period).slice(0, 2);
  const schedule = `${count(input.hoursPerWeek)} hours a week, ${count(input.weeksPerYear)} paid weeks`;
  /** @type {Array<{ period: string, amount: string, note: string, selected?: boolean }>} */
  const rows = Object.entries(PAY_PERIODS).map(([period, { label }]) => ({
    period: label,
    amount: formatCurrency(pay[period]),
    note: PERIOD_NOTES[period],
    ...(period === input.period ? { selected: true } : {})
  }));
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your pay in every period</h2>
  ${statGrid([
    { label: primary === 'year' ? 'Annual salary' : 'Hourly rate', value: primary === 'year' ? formatCurrencyWhole(pay.year) : formatCurrency(pay.hour), primary: true, note: schedule },
    ...secondary.map((period) => ({ label: PAY_PERIODS[period].label, value: formatCurrency(pay[period]), note: PERIOD_NOTES[period] })),
    ...(input.paidDaysOff > 0 ? [{ label: 'Per hour actually worked', value: formatCurrency(view.effectiveHourly), note: `${count(view.hoursWorked)} hours after ${count(input.paidDaysOff)} paid days off` }] : [])
  ])}
  ${dataTable({
    id: 'hs-periods',
    title: 'Gross pay by period',
    columns: [
      { key: 'period', label: 'Period' },
      { key: 'amount', label: 'Pay', numeric: true },
      { key: 'note', label: 'Based on' }
    ],
    rows
  })}
  <p class="note">${count(view.hoursPerYear)} hours a year${input.overtimeHours > 0 ? html`, including ${count(input.overtimeHours * input.weeksPerYear)} overtime hours worth ${formatCurrencyWhole(view.overtimePay)}` : ''}.
  All figures are before taxes and deductions${input.weeksPerYear < 52 ? '; biweekly, semimonthly and monthly amounts average your annual pay across the year' : ''}.</p>
</section>`;
}

export function hourlySalaryQuickResult(view) {
  const { input, pay } = view;
  const primary = primaryPeriod(view);
  const shown = primary === 'year' ? formatCurrencyWhole(pay.year) : formatCurrency(pay.hour);
  return html`${formatCurrency(input.amount)} ${PAY_PERIODS[input.period].per} is <strong>${shown} ${PAY_PERIODS[primary].per}</strong>. <a href="#summary-heading">See full results</a>`;
}

export function hourlySalaryAnnouncement(view) {
  const { input, pay } = view;
  return `${formatCurrency(input.amount)} ${PAY_PERIODS[input.period].per} is ${formatCurrencyWhole(pay.year)} a year, ${formatCurrency(pay.month)} a month and ${formatCurrency(pay.hour)} an hour.`;
}
