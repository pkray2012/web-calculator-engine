/**
 * 401(k) Calculator page. Example results, the limits table and every worked
 * figure in the explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrencyWhole } from '../lib/format.js';
import { retirement401kForm } from '../components/retirement-401k-form.js';
import { retirement401kResults, retirement401kQuickResult } from '../components/retirement-401k-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { RETIREMENT_401K_DEFAULTS, parse401kForm, build401kView } from '../adapters/retirement-401k.js';
import { project401k, deferralLimit, LIMITS_2026 } from '../calculators/retirement-401k.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return build401kView(parse401kForm({ ...RETIREMENT_401K_DEFAULTS, ...overrides }).input);
}

export function retirement401kPage() {
  const calculator = findCalculator('401k-calculator');
  const example = exampleView();
  const { input } = example;
  const safeHarbor = { match1Rate: 100, match1UpTo: 3, match2Rate: 50, match2UpTo: 2 };
  const atThree = project401k({ currentAge: 40, retirementAge: 41, salary: 60_000, contributionPercent: 3, ...safeHarbor });
  const atFive = project401k({ currentAge: 40, retirementAge: 41, salary: 60_000, contributionPercent: 5, ...safeHarbor });
  const earlyLimit = project401k({ currentAge: 40, retirementAge: 41, salary: 300_000, contributionPercent: 10, ...safeHarbor });
  const noGrowth = exampleView({ annualReturn: '0' });
  const lower = exampleView({ contributionPercent: '5' });
  const higher = exampleView({ contributionPercent: '10' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Estimate your 401(k) balance at retirement from your salary, the share of pay you contribute and your employer's match. The calculator
  applies the 2026 IRS contribution limits, including catch-up contributions from age 50, and shows whether you are getting the full match. Your inputs
  stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your 401(k)',
    form: retirement401kForm(RETIREMENT_401K_DEFAULTS, {}, retirement401kQuickResult(example)),
    exampleNote: `Example: age ${input.currentAge}, retiring at ${input.retirementAge}, earning $${input.salary.toLocaleString('en-US')} with ${input.contributionPercent}% contributed, a $${input.currentBalance.toLocaleString('en-US')} balance, a match of 100% of the first 3% and 50% of the next 2%, ${input.annualReturn}% returns and ${input.salaryGrowth}% raises. These are illustrative, not forecasts.`,
    results: retirement401kResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="rk-grow-heading">
    <h2 id="rk-grow-heading">How a 401(k) grows</h2>
    <p>Three things build the balance: what you contribute from each paycheck, what your employer adds, and investment returns on both. Over a long
    career the returns usually become the largest part. In the example, ${formatCurrencyWhole(example.employeeTotal)} of your contributions and
    ${formatCurrencyWhole(example.employerTotal)} from your employer grow to ${formatCurrencyWhole(example.balance)}; with no investment return the same
    contributions would total ${formatCurrencyWhole(noGrowth.balance)}.</p>
    <p>Small changes in the contribution rate compound too. The same example at 5% of pay reaches ${formatCurrencyWhole(lower.balance)}, and at 10%
    ${formatCurrencyWhole(higher.balance)}.</p>
  </section>

  <section class="content-section" aria-labelledby="rk-limits-heading">
    <h2 id="rk-limits-heading">2026 401(k) contribution limits</h2>
    <p>The IRS sets how much you can defer from your pay each year (<a href="${SOURCES.irs401kLimits2026.url}">IRS: 2026 limits</a>). Pre-tax and Roth
    401(k) deferrals share one limit. Catch-up contributions are allowed if your plan offers them, from the year you turn 50; ages 60 to 63 get a higher
    catch-up instead.</p>
    ${dataTable({
      id: 'rk-limits',
      title: 'Employee deferral limits for 2026',
      columns: [{ key: 'age', label: 'Age during 2026' }, { key: 'limit', label: 'Your limit', numeric: true }],
      rows: [
        { age: 'Under 50', limit: formatCurrencyWhole(deferralLimit(40)) },
        { age: '50 to 59, or 64 and over', limit: formatCurrencyWhole(deferralLimit(50)) },
        { age: '60 to 63', limit: formatCurrencyWhole(deferralLimit(60)) }
      ]
    })}
    <p>Separately, your contributions (not counting catch-up) plus your employer's cannot exceed ${formatCurrencyWhole(LIMITS_2026.annualAdditions)} in 2026.
    The calculator keeps these limits at their 2026 amounts for every future year; the IRS usually raises them with inflation, so for long projections
    the real limits are likely to be higher.</p>
  </section>

  <section class="content-section" aria-labelledby="rk-match-heading">
    <h2 id="rk-match-heading">How the employer match works</h2>
    <p>A match formula such as “100% of the first 3% of pay and 50% of the next 2%” means your employer adds a dollar for each dollar you put in up to 3% of
    your salary, and 50 cents per dollar on the next 2%. Contributing 5% earns the full match of 4% of pay. On a $60,000 salary, contributing 3% brings
    ${formatCurrencyWhole(atThree.firstYearEmployer)} of match a year; contributing 5% brings ${formatCurrencyWhole(atFive.firstYearEmployer)}. Check your plan's
    summary plan description for the exact formula and any vesting schedule, which decides how much of the match you keep if you leave.</p>
    <p>Many plans match each paycheck. If you reach the annual limit before December, your contributions stop and so does the match for the rest of the
    year, unless the plan makes a year-end true-up. Someone earning $300,000 who contributes 10% reaches the limit in October and misses about
    ${formatCurrencyWhole(earlyLimit.firstYearMatchMissed)} of match that way. The calculator shows when this happens.</p>
  </section>

  <section class="content-section" aria-labelledby="rk-tax-heading">
    <h2 id="rk-tax-heading">Traditional and Roth 401(k) contributions</h2>
    <p>Traditional (pre-tax) contributions lower your taxable income now, and withdrawals in retirement are taxed as income. Roth contributions are made
    after tax, and qualified withdrawals are tax-free. The balance shown here is before any income tax, so a traditional balance is worth less to you
    after tax than the same Roth balance. Withdrawals before age 59½ can also owe an additional tax unless an exception applies.</p>
  </section>

  <section class="content-section" aria-labelledby="rk-assumptions-heading">
    <h2 id="rk-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>The return is constant every year and is after fund fees. Real returns vary widely, including losing years, especially near retirement.</li>
      <li>Your age during each year is your current age plus the years elapsed, and catch-up contributions are included once you reach 50.</li>
      <li>The employer match is paid each month on that month's contribution, with no year-end true-up and full vesting.</li>
      <li>IRS limits stay at their 2026 amounts. Pay above the IRS annual compensation limit, which caps the pay a plan can count for the match, is not
      modeled, and some plans set lower limits of their own.</li>
      <li>No loans, withdrawals, job changes or gaps in contributions. The balance is before income tax.</li>
      <li>This is an estimate, not financial or tax advice; your plan's statements are the record of your account.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="rk-method-heading">
    <h2 id="rk-method-heading">Methodology and testing</h2>
    <p>The projection runs month by month: the balance grows at the monthly equivalent of the annual return, then that month's contribution (pay ÷ 12 ×
    your percentage, stopping at the year's limit for your age) and the employer's match on it are added. Pay rises once a year. Automated tests check
    each 2026 limit and the age bands, the match formula, a projection with no return against the sum of contributions, level contributions against the
    future-value-of-an-annuity formula, the limit and match stopping mid-year, the ${formatCurrencyWhole(LIMITS_2026.annualAdditions)} total cap, and a combined
    case against an independent simulation. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.irs401kLimits2026])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/retirement-401k.js']
  };
}
