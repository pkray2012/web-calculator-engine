/**
 * Results panel for the Overtime Calculator. Pure function of the view model
 * from src/adapters/overtime.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';
import { DAY_NAMES } from '../adapters/overtime.js';

const hrs = (value) => `${Number(value.toFixed(2)).toLocaleString('en-US')} h`;

export function overtimeResults(view) {
  const { input } = view;
  const weeks = input.weeks;
  const rows = [
    { item: `Regular: ${hrs(view.regularHours)} × ${formatCurrency(input.hourlyRate)}`, amount: formatCurrency(view.regularPay) },
    { item: `Overtime: ${hrs(view.overtimeHours)} × ${formatCurrency(view.overtimeRate)}`, amount: formatCurrency(view.overtimePay) },
    ...(input.rule === 'california' ? [{ item: `Double time: ${hrs(view.doubleTimeHours)} × ${formatCurrency(view.doubleTimeRate)}`, amount: formatCurrency(view.doubleTimePay) }] : []),
    { item: 'Gross pay for the week', amount: formatCurrency(view.totalPay) }
  ];
  const dayRows = view.days.map((day, i) => ({
    day: `${DAY_NAMES[i]}${day.seventhDay ? ' (7th day)' : ''}`,
    hours: hrs(input.hours[i]),
    regular: hrs(day.regular),
    overtime: hrs(day.overtime),
    ...(input.rule === 'california' ? { double: hrs(day.doubleTime) } : {})
  }));
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your overtime pay</h2>
  ${statGrid([
    { label: weeks > 1 ? `Gross pay for ${weeks} weeks` : 'Gross pay for the week', value: formatCurrency(view.periodPay), primary: true, note: 'Before taxes and deductions' },
    { label: 'Overtime hours', value: hrs(view.overtimeHours + view.doubleTimeHours), note: input.rule === 'california' && view.doubleTimeHours > 0 ? `Including ${hrs(view.doubleTimeHours)} at double time` : `Paid at ${formatCurrency(view.overtimeRate)} an hour` },
    { label: 'Extra from overtime', value: formatCurrency(view.periodPremium), note: 'Compared with paying every hour at the regular rate' },
    { label: 'Average per hour', value: formatCurrency(view.averageHourly), note: `${hrs(view.totalHours)} worked` }
  ])}
  ${dataTable({ id: 'ot-pay', title: 'Pay for one week', columns: [{ key: 'item', label: 'Hours and rate' }, { key: 'amount', label: 'Pay', numeric: true }], rows })}
  ${dataTable({
    id: 'ot-days',
    title: 'Hours by day',
    columns: [
      { key: 'day', label: 'Day' },
      { key: 'hours', label: 'Worked', numeric: true },
      { key: 'regular', label: 'Regular', numeric: true },
      { key: 'overtime', label: 'Overtime', numeric: true },
      ...(input.rule === 'california' ? [{ key: 'double', label: 'Double time', numeric: true }] : [])
    ],
    rows: dayRows
  })}
  <p class="note">Gross pay before taxes. Your regular rate for overtime may need to include bonuses, commissions and shift differentials, and some jobs
  are exempt from overtime. This is an estimate, not legal advice.</p>
</section>`;
}

export function overtimeQuickResult(view) {
  return html`<strong>${formatCurrency(view.periodPay)}</strong> gross, with ${hrs(view.overtimeHours + view.doubleTimeHours)} of overtime a week. <a href="#summary-heading">See full results</a>`;
}

export function overtimeAnnouncement(view) {
  return `Gross pay ${formatCurrency(view.periodPay)}, including ${hrs(view.overtimeHours + view.doubleTimeHours)} of overtime a week.`;
}
