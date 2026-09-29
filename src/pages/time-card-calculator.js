/**
 * Time Card Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { timeCardForm } from '../components/time-card-form.js';
import { timeCardResults, timeCardQuickResult } from '../components/time-card-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { TIME_CARD_DEFAULTS, parseTimeCardForm, buildTimeCardView } from '../adapters/time-card.js';
import { hoursAndMinutes, decimalHours, shiftMinutes } from '../calculators/time-card.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildTimeCardView(parseTimeCardForm({ ...TIME_CARD_DEFAULTS, ...overrides }).input);
}

export function timeCardPage() {
  const calculator = findCalculator('time-card-calculator');
  const example = exampleView();
  const { input } = example;
  const day = input.days[0];
  const dayWorked = example.perDay[0].worked;
  const night = shiftMinutes({ start: 22 * 60, end: 6 * 60 + 30, breakMinutes: 30 });
  const minutes = [5, 6, 10, 12, 15, 20, 30, 45];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Add up the hours on your time card: enter start and end times and unpaid breaks for each day to get hours worked per day and for
  the week, in hours and minutes and in decimal hours for payroll, with overtime past 40 hours and gross pay at your hourly rate. Your inputs stay
  in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your time card',
    form: timeCardForm(TIME_CARD_DEFAULTS, {}, timeCardQuickResult(example)),
    exampleNote: `Example: 8:00 AM to 5:30 PM with a ${day.breakMinutes}-minute unpaid lunch, Monday to Friday, at ${formatCurrency(input.hourlyRate)} an hour. Enter your times to update.`,
    results: timeCardResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="tc-how-heading">
    <h2 id="tc-how-heading">How to calculate hours worked</h2>
    <ol>
      <li>Subtract the start time from the end time. 8:00 AM to 5:30 PM is 9 hours 30 minutes.</li>
      <li>Subtract unpaid breaks. Take away the ${day.breakMinutes}-minute lunch and the day is ${hoursAndMinutes(dayWorked)}, or ${decimalHours(dayWorked).toFixed(2)} hours.</li>
      <li>Add the days. Five of those days are ${hoursAndMinutes(example.totalMinutes)} hours for the week.</li>
    </ol>
    <p>A shift that ends after midnight is counted to the next morning: 10:00 PM to 6:30 AM with a 30-minute break is ${hoursAndMinutes(night.worked)} hours.
    The calculator works in whole minutes, so the totals are exact.</p>
  </section>

  <section class="content-section" aria-labelledby="tc-decimal-heading">
    <h2 id="tc-decimal-heading">Converting minutes to decimal hours</h2>
    <p>Payroll systems usually want hours as a decimal: divide the minutes by 60. 7 hours 45 minutes is 7.75 hours, not 7.45. The results show both
    formats.</p>
    ${dataTable({
      id: 'tc-decimal',
      title: 'Minutes as decimal hours',
      columns: [{ key: 'min', label: 'Minutes' }, { key: 'dec', label: 'Decimal hours', numeric: true }],
      rows: minutes.map((m) => ({ min: `${m} min`, dec: (m / 60).toFixed(2).replace(/0$/, '') }))
    })}
  </section>

  <section class="content-section" aria-labelledby="tc-ot-heading">
    <h2 id="tc-ot-heading">Overtime</h2>
    <p>Under the federal Fair Labor Standards Act, covered non-exempt employees must be paid at least one and a half times their regular rate for
    hours worked over 40 in a workweek (<a href="${SOURCES.flsaOvertime.url}">U.S. Department of Labor: overtime pay</a>). In the example,
    ${decimalHours(example.totalMinutes)} hours is ${decimalHours(example.overtimeMinutes)} hours of overtime, so gross pay is ${formatCurrency(example.pay.regular)} regular plus
    ${formatCurrency(example.pay.overtime)} overtime = ${formatCurrency(example.pay.total)}.</p>
    <p>Some states also require overtime after a set number of hours in a day, and some employers pay a different rate or start overtime earlier.
    You can change the weekly threshold and the overtime rate; daily overtime is not calculated.</p>
  </section>

  <section class="content-section" aria-labelledby="tc-assumptions-heading">
    <h2 id="tc-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Breaks you enter are unpaid and are subtracted; paid breaks should be left out.</li>
      <li>Times are not rounded. Some employers round punches, for example to the nearest quarter hour.</li>
      <li>Pay is gross, before taxes and deductions, for one workweek at one hourly rate.</li>
      <li>Whether you are owed overtime depends on your job and your state; this is not legal advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="tc-method-heading">
    <h2 id="tc-method-heading">Methodology and testing</h2>
    <p>Automated tests check hand-worked examples, overnight shifts, odd minutes and custom overtime rules, and compare 2,000 random weeks against
    an independent calculation using calendar date arithmetic. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.flsaOvertime])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/time-card.js']
  };
}
