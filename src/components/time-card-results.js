/**
 * Results panel for the Time Card Calculator. Pure function of the view model
 * from src/adapters/time-card.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';
import { hoursAndMinutes, decimalHours } from '../calculators/time-card.js';
import { TIME_CARD_DAYS } from '../adapters/time-card.js';

const decimal = (minutes) => decimalHours(minutes).toFixed(2);
const both = (minutes) => `${hoursAndMinutes(minutes)} (${decimal(minutes)} h)`;
const clock = (minutes) => {
  const h = Math.floor(minutes / 60);
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${((h + 11) % 12) + 1}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
};

export function timeCardResults(view) {
  const { input } = view;
  /** @type {Array<{ day: string, shift: string, breaks: string, hours: string, decimal: string, selected?: boolean }>} */
  const rows = TIME_CARD_DAYS.flatMap(({ name }, index) => {
    const day = input.days[index];
    const worked = view.perDay[index];
    if (!day) return [];
    return [{
      day: name,
      shift: `${clock(day.start)} – ${clock(day.end)}${worked.overnight ? ' (next day)' : ''}`,
      breaks: `${day.breakMinutes} min`,
      hours: hoursAndMinutes(worked.worked),
      decimal: decimal(worked.worked)
    }];
  });
  rows.push({ day: 'Total', shift: '', breaks: '', hours: hoursAndMinutes(view.totalMinutes), decimal: decimal(view.totalMinutes), selected: true });
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your hours this week</h2>
  ${statGrid([
    { label: 'Total hours', value: hoursAndMinutes(view.totalMinutes), primary: true, note: `${decimal(view.totalMinutes)} decimal hours over ${view.daysWorked} ${view.daysWorked === 1 ? 'day' : 'days'}` },
    { label: 'Regular hours', value: decimal(view.regularMinutes), note: hoursAndMinutes(view.regularMinutes) },
    { label: 'Overtime hours', value: decimal(view.overtimeMinutes), note: `After ${input.overtimeAfterHours} hours a week` },
    ...(view.pay ? [{ label: 'Gross pay', value: formatCurrency(view.pay.total), note: `${formatCurrency(view.pay.regular)} regular + ${formatCurrency(view.pay.overtime)} overtime` }] : [])
  ])}
  ${dataTable({
    id: 'tc-days',
    title: 'Hours by day',
    columns: [
      { key: 'day', label: 'Day' },
      { key: 'shift', label: 'Shift' },
      { key: 'breaks', label: 'Break', numeric: true },
      { key: 'hours', label: 'Hours (h:mm)', numeric: true },
      { key: 'decimal', label: 'Decimal hours', numeric: true }
    ],
    rows
  })}
  ${view.pay ? '' : html`<p class="note">Add an hourly rate to estimate gross pay before taxes and deductions.</p>`}
</section>`;
}

export function timeCardQuickResult(view) {
  return html`<strong>${both(view.totalMinutes)}</strong> worked${view.overtimeMinutes ? html`, ${decimal(view.overtimeMinutes)} h overtime` : ''}${view.pay ? html`: ${formatCurrency(view.pay.total)} gross` : ''}. <a href="#summary-heading">See full results</a>`;
}

export function timeCardAnnouncement(view) {
  return `${both(view.totalMinutes)} worked, including ${decimal(view.overtimeMinutes)} overtime hours.${view.pay ? ` Gross pay ${formatCurrency(view.pay.total)}.` : ''}`;
}
