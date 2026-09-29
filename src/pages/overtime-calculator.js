/**
 * Overtime Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency } from '../lib/format.js';
import { overtimeForm } from '../components/overtime-form.js';
import { overtimeResults, overtimeQuickResult } from '../components/overtime-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { OVERTIME_DEFAULTS, parseOvertimeForm, buildOvertimeView } from '../adapters/overtime.js';
import { weeklyOvertime } from '../calculators/overtime.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildOvertimeView(parseOvertimeForm({ ...OVERTIME_DEFAULTS, ...overrides }).input);
}

export function overtimePage() {
  const calculator = findCalculator('overtime-calculator');
  const example = exampleView();
  const { input } = example;
  const fourTens = { hourlyRate: 20, hours: [10, 10, 10, 10, 0, 0, 0] };
  const fourTensFederal = weeklyOvertime(fourTens);
  const fourTensCa = weeklyOvertime({ ...fourTens, rule: 'california' });
  const longDay = weeklyOvertime({ hourlyRate: 20, hours: [14, 0, 0, 0, 0, 0, 0], rule: 'california' });
  const seventh = weeklyOvertime({ hourlyRate: 20, hours: [8, 8, 8, 8, 8, 4, 10], rule: 'california' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out a week's gross pay with overtime from your hourly rate and the hours you worked each day, under the federal 40-hour rule or
  California's daily overtime and double-time rules. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your pay and hours',
    form: overtimeForm(OVERTIME_DEFAULTS, {}, overtimeQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.hourlyRate)} an hour, five 9-hour days, federal rule. Enter your own hours to update.`,
    results: overtimeResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="ot-federal-heading">
    <h2 id="ot-federal-heading">How overtime is calculated under federal law</h2>
    <p>The Fair Labor Standards Act requires covered, non-exempt employees to be paid at least one and a half times their regular rate for hours worked
    over 40 in a workweek (<a href="${SOURCES.flsaOvertime.url}">U.S. Department of Labor: overtime pay</a>). The workweek is a fixed, recurring 7-day
    period set by the employer; each week stands alone, so hours are not averaged over two weeks.</p>
    <p class="formula"><code>Weekly pay = rate × regular hours (up to 40) + rate × 1.5 × hours over 40</code></p>
    <p>The example: ${input.hours.filter((h) => h > 0).length} days of 9 hours is ${example.totalHours} hours, so 40 are paid at ${formatCurrency(input.hourlyRate)} and
    ${example.overtimeHours} at ${formatCurrency(example.overtimeRate)}, for ${formatCurrency(example.totalPay)} before taxes. Federal law does not require overtime
    for long days on their own: four 10-hour days at $20 are 40 hours and ${formatCurrency(fourTensFederal.totalPay)}, with no overtime.</p>
  </section>

  <section class="content-section" aria-labelledby="ot-ca-heading">
    <h2 id="ot-ca-heading">California daily overtime and double time</h2>
    <p>California also pays overtime by the day (<a href="${SOURCES.caOvertime.url}">California Labor Commissioner: overtime</a>):</p>
    <ul>
      <li>1.5 × for hours over 8 and up to 12 in a workday, and for hours over 40 in the workweek.</li>
      <li>2 × for hours over 12 in a workday.</li>
      <li>On the seventh consecutive day of work in a workweek, 1.5 × for the first 8 hours and 2 × after that.</li>
    </ul>
    <p>The same four 10-hour days pay ${formatCurrency(fourTensCa.totalPay)} in California, because 2 hours a day are overtime. A single 14-hour day is 8 regular,
    4 overtime and 2 double-time hours: ${formatCurrency(longDay.totalPay)} at $20. Hours already paid as daily overtime are not counted again toward the weekly 40,
    and the calculator applies both rules without paying any hour twice. A week of 8, 8, 8, 8, 8, 4 and 10 hours at $20 pays ${formatCurrency(seventh.totalPay)},
    including ${seventh.doubleTimeHours} double-time hours on the seventh day.</p>
  </section>

  <section class="content-section" aria-labelledby="ot-regular-heading">
    <h2 id="ot-regular-heading">What counts as the regular rate</h2>
    <p>Overtime is based on the regular rate of pay, which can be higher than the base hourly wage: non-discretionary bonuses, shift differentials and
    commissions are generally included, while things like expense reimbursements and gifts are not. If you earn these, your overtime rate may be higher
    than this calculator shows. Salaried employees can also be owed overtime unless their job is exempt.</p>
  </section>

  <section class="content-section" aria-labelledby="ot-assumptions-heading">
    <h2 id="ot-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>One workweek at a single hourly rate; enter a number of identical weeks for a biweekly paycheck.</li>
      <li>Gross pay only, before federal and state taxes and deductions.</li>
      <li>Other states have their own rules, such as daily overtime in Alaska, Nevada and Colorado, and some jobs and industries have exceptions,
      including alternative workweek schedules in California. Check your state's labor department.</li>
      <li>Whether you are covered by overtime law depends on your job; this is not legal advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="ot-method-heading">
    <h2 id="ot-method-heading">Methodology and testing</h2>
    <p>Federal: hours past 40 in the week, counted from the first day, are paid at the overtime rate. California: each day is split into regular (up to 8),
    overtime (8 to 12) and double time (over 12), with the seventh-day rule when all seven days are worked; then regular hours past 40 in the week move to
    overtime. Automated tests cover each rule, the weekly and daily interaction, and the seventh day. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.flsaOvertime, SOURCES.caOvertime])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/overtime.js']
  };
}
