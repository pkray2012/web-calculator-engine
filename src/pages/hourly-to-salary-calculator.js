/**
 * Hourly to Salary Calculator page. Example results, both rate tables and
 * every worked figure in the explanatory content are computed from the engine
 * at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole } from '../lib/format.js';
import { hourlySalaryForm } from '../components/hourly-salary-form.js';
import { hourlySalaryResults, hourlySalaryQuickResult } from '../components/hourly-salary-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { HOURLY_SALARY_DEFAULTS, parseHourlySalaryForm, buildHourlySalaryView } from '../adapters/hourly-salary.js';
import { convertPay } from '../calculators/hourly-salary.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';
import { faqSection, faqStructuredData, directAnswer } from '../components/faq.js';

const HOURLY_RATES = [15, 16, 17, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50, 60, 75];
const SALARIES = [30_000, 40_000, 45_000, 50_000, 55_000, 60_000, 65_000, 70_000, 75_000, 80_000, 90_000, 100_000, 120_000, 150_000, 200_000];

function exampleView(overrides = {}) {
  return buildHourlySalaryView(parseHourlySalaryForm({ ...HOURLY_SALARY_DEFAULTS, ...overrides }).input);
}

export function hourlyToSalaryPage() {
  const calculator = findCalculator('hourly-to-salary-calculator');
  const example = exampleView();
  const { input } = example;
  const fullTimeHours = example.hoursPerYear;
  const salary = convertPay({ amount: 60_000, period: 'year' });
  const unpaid = convertPay({ amount: input.amount, period: 'hour', weeksPerYear: 50 });
  const daysOff = convertPay({ amount: 60_000, period: 'year', paidDaysOff: 25 });
  const overtime = convertPay({ amount: 20, period: 'hour', overtimeHours: 5 });
  const plain = convertPay({ amount: 20, period: 'hour' });

  // Direct answer and FAQ figures, all from the engine.
  const faq15 = convertPay({ amount: 15, period: 'hour' });
  const faq50 = convertPay({ amount: 50, period: 'hour' });
  const faqs = [
    { question: 'How do I convert an hourly wage to a yearly salary?', answer: `Multiply the hourly rate by hours a week and by paid weeks a year. Full time is 40 × 52 = 2,080 hours, so ${formatCurrency(input.amount)} an hour is ${formatCurrencyWhole(example.pay.year)} a year.` },
    { question: 'How much is $15 an hour per year?', answer: `${formatCurrencyWhole(faq15.pay.year)} a year at 40 hours a week for 52 weeks, or ${formatCurrency(faq15.pay.month)} a month.` },
    { question: 'How much is $50 an hour per year?', answer: `${formatCurrencyWhole(faq50.pay.year)} a year full time, or ${formatCurrency(faq50.pay.biweek)} every two weeks.` },
    { question: 'How do I convert a salary to an hourly rate?', answer: `Divide the salary by the hours you are paid for in a year. ${formatCurrencyWhole(salary.pay.year)} ÷ 2,080 = ${formatCurrency(salary.pay.hour)} an hour.` },
    { question: 'How does unpaid time off change my annual pay?', answer: `Use only the weeks you are paid. At ${formatCurrency(input.amount)} an hour, 50 paid weeks instead of 52 is ${formatCurrencyWhole(unpaid.pay.year)} a year.` },
    { question: 'How does overtime change my yearly pay?', answer: `Overtime hours are paid at 1.5 times the rate here. At $20 an hour, 5 overtime hours a week raise yearly pay from ${formatCurrencyWhole(plain.pay.year)} to ${formatCurrencyWhole(overtime.pay.year)}.` }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Annual salary = hourly rate × hours a week × paid weeks a year</strong>, and hourly rate = salary ÷ hours a year.
  ${formatCurrency(input.amount)} an hour at 40 hours a week for 52 weeks (2,080 hours) is ${formatCurrencyWhole(example.pay.year)} a year.`)}
  <p class="lede">Convert an hourly wage to an annual salary, or a salary to an hourly rate, and see the same pay per day, week, biweekly and
  semimonthly paycheck, and month. Set your own hours, paid weeks, overtime and paid days off. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your pay and schedule',
    form: hourlySalaryForm(HOURLY_SALARY_DEFAULTS, {}, hourlySalaryQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(input.amount)} an hour, ${input.hoursPerWeek} hours a week, ${input.weeksPerYear} paid weeks a year. Enter your pay and choose hour, week, paycheck, month or year to update.`,
    results: hourlySalaryResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="hs-hourly-heading">
    <h2 id="hs-hourly-heading">How to convert hourly pay to a salary</h2>
    <p>Multiply your hourly rate by the hours you are paid for in a week, then by the weeks you are paid for in a year:</p>
    <p class="formula"><code>Annual salary = hourly rate × hours a week × paid weeks a year</code></p>
    <p>At ${formatCurrency(input.amount)} an hour, 40 hours a week for 52 weeks is ${formatCurrency(input.amount)} × ${fullTimeHours.toLocaleString('en-US')} hours =
    ${formatCurrencyWhole(example.pay.year)} a year, or ${formatCurrency(example.pay.month)} a month. A quick estimate is to double the hourly rate and add three
    zeros (${formatCurrency(input.amount)} → about $${(input.amount * 2).toLocaleString('en-US')},000); that uses 2,000 hours, so it runs a little under the
    full-time figure of 2,080.</p>
  </section>

  <section class="content-section" aria-labelledby="hs-salary-heading">
    <h2 id="hs-salary-heading">How to convert a salary to an hourly rate</h2>
    <p>Divide the annual salary by the hours you are paid for in a year. For a full-time schedule that is 2,080 hours:
    ${formatCurrencyWhole(salary.pay.year)} ÷ 2,080 = ${formatCurrency(salary.pay.hour)} an hour, ${formatCurrency(salary.pay.week)} a week and
    ${formatCurrency(salary.pay.biweek)} every two weeks.</p>
    <p>A salaried job's hourly rate is only an equivalent: it is useful for comparing job offers or an hourly job with a salaried one, but a
    salaried employee who works more than 40 hours a week earns less per hour than this figure unless they are paid overtime.</p>
  </section>

  <section class="content-section" aria-labelledby="hs-rates-heading">
    <h2 id="hs-rates-heading">Hourly wages as annual salaries</h2>
    <p>Full time: 40 hours a week, 52 paid weeks, no overtime. Enter your own hours above if they differ.</p>
    ${dataTable({
      id: 'hs-rates',
      title: 'Common hourly wages per year, month, two weeks and week',
      columns: [
        { key: 'rate', label: 'Hourly', numeric: true },
        { key: 'year', label: 'Per year', numeric: true },
        { key: 'month', label: 'Per month', numeric: true },
        { key: 'biweek', label: 'Every two weeks', numeric: true },
        { key: 'week', label: 'Per week', numeric: true }
      ],
      rows: HOURLY_RATES.map((rate) => {
        const { pay } = convertPay({ amount: rate, period: 'hour' });
        return { rate: formatCurrency(rate), year: formatCurrencyWhole(pay.year), month: formatCurrencyWhole(pay.month), biweek: formatCurrencyWhole(pay.biweek), week: formatCurrencyWhole(pay.week) };
      })
    })}
  </section>

  <section class="content-section" aria-labelledby="hs-salaries-heading">
    <h2 id="hs-salaries-heading">Annual salaries as hourly wages</h2>
    ${dataTable({
      id: 'hs-salaries',
      title: 'Common salaries per hour, week and month (2,080 hours a year)',
      columns: [
        { key: 'salary', label: 'Salary', numeric: true },
        { key: 'hour', label: 'Per hour', numeric: true },
        { key: 'week', label: 'Per week', numeric: true },
        { key: 'month', label: 'Per month', numeric: true }
      ],
      rows: SALARIES.map((amount) => {
        const { pay } = convertPay({ amount, period: 'year' });
        return { salary: formatCurrencyWhole(amount), hour: formatCurrency(pay.hour), week: formatCurrencyWhole(pay.week), month: formatCurrencyWhole(pay.month) };
      })
    })}
  </section>

  <section class="content-section" aria-labelledby="hs-time-off-heading">
    <h2 id="hs-time-off-heading">Unpaid and paid time off</h2>
    <p><strong>Unpaid time off lowers your pay.</strong> If you are paid by the hour and take two weeks off unpaid, you are paid for 50 weeks:
    ${formatCurrency(input.amount)} × 40 × 50 = ${formatCurrencyWhole(unpaid.pay.year)} a year instead of ${formatCurrencyWhole(example.pay.year)}. Set
    “Paid weeks a year” to 50.</p>
    <p><strong>Paid time off does not lower your pay, but it raises what you earn per hour worked.</strong> A ${formatCurrencyWhole(daysOff.pay.year)}
    salary with 15 vacation days and 10 paid holidays is paid for 2,080 hours but worked for ${daysOff.hoursWorked.toLocaleString('en-US')}, so it is
    ${formatCurrency(daysOff.effectiveHourly)} per hour actually worked, against ${formatCurrency(daysOff.pay.hour)} on paper. Enter paid days off to see this
    figure; it helps when comparing a job with more paid leave to one with less.</p>
  </section>

  <section class="content-section" aria-labelledby="hs-ot-heading">
    <h2 id="hs-ot-heading">Overtime</h2>
    <p>Under the federal Fair Labor Standards Act, covered non-exempt employees must be paid at least one and a half times their regular rate for
    hours over 40 in a workweek (<a href="${SOURCES.flsaOvertime.url}">U.S. Department of Labor: overtime pay</a>). At ${formatCurrency(20)} an hour,
    5 overtime hours every week add ${formatCurrencyWhole(overtime.overtimePay)} a year: ${formatCurrencyWhole(overtime.pay.year)} instead of
    ${formatCurrencyWhole(plain.pay.year)}. Enter your usual overtime hours and rate above; if your overtime varies, use an average.</p>
    <p>If you enter a salary together with overtime hours, the hourly result is the regular rate that, with overtime paid at your multiple,
    adds up to that salary.</p>
  </section>

  <section class="content-section" aria-labelledby="hs-periods-heading">
    <h2 id="hs-periods-heading">Biweekly, semimonthly and monthly pay</h2>
    <ul>
      <li><strong>Biweekly</strong>: every two weeks, 26 paychecks a year. ${formatCurrencyWhole(example.pay.year)} a year is ${formatCurrency(example.pay.biweek)} a paycheck.</li>
      <li><strong>Semimonthly</strong>: twice a month, 24 paychecks a year, so each is larger: ${formatCurrency(example.pay.semimonth)}.</li>
      <li><strong>Monthly</strong>: a year's pay ÷ 12 = ${formatCurrency(example.pay.month)}. A month is about 4.33 weeks, not 4, so multiplying weekly
      pay by 4 understates it (${formatCurrency(example.pay.week * 4)} against ${formatCurrency(example.pay.month)}).</li>
    </ul>
    <p>Some calendar years have 27 biweekly paydays instead of 26; this calculator uses 26.</p>
  </section>

  <section class="content-section" aria-labelledby="hs-assumptions-heading">
    <h2 id="hs-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>All figures are gross pay, before federal and state income tax, Social Security and Medicare, and deductions such as health insurance or
      retirement contributions. Take-home pay is lower.</li>
      <li>Hours, overtime and paid weeks are the same every week you work. Irregular schedules are best entered as averages.</li>
      <li>Daily overtime rules that some states add, shift differentials, tips, bonuses and commissions are not included.</li>
      <li>Whether you are owed overtime depends on your job and your state; this is not legal or tax advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="hs-method-heading">
    <h2 id="hs-method-heading">Methodology and testing</h2>
    <p>Annual pay = hourly rate × (regular hours + overtime hours × overtime rate) × paid weeks. Biweekly, semimonthly and monthly pay are annual pay ÷
    26, 24 and 12; a salary entered per paycheck is multiplied back the same way. Automated tests check hand-worked examples, round trips from
    every pay period to every other, paid days off and overtime. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'hs-faq')}

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
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/hourly-salary.js']
  };
}
