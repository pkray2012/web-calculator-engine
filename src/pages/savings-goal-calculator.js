/**
 * Savings Goal Calculator page. Example results and every worked figure in the
 * explanatory content are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatPercent, formatDuration } from '../lib/format.js';
import { savingsGoalForm } from '../components/savings-goal-form.js';
import { savingsGoalResults, savingsQuickResult } from '../components/savings-goal-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { SAVINGS_DEFAULTS, parseSavingsForm, buildSavingsView } from '../adapters/savings-goal.js';
import { findCalculator, relatedCalculators } from '../content/site.js';
import { SOURCES } from '../content/sources.js';

function exampleView(overrides = {}) {
  return buildSavingsView(parseSavingsForm({ ...SAVINGS_DEFAULTS, ...overrides }).input);
}

export function savingsGoalPage() {
  const calculator = findCalculator('savings-goal-calculator');
  const example = exampleView();
  const { input } = example;
  const noInterest = exampleView({ apy: '0' });
  const fiveYears = exampleView({ timeValue: '5' });
  const emergency = exampleView({ goalType: 'emergency' });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Find how much to save each month to reach a goal or build an emergency fund by a date, or how long a set monthly deposit
  takes, with interest at your account's APY. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your goal and plan',
    form: savingsGoalForm(SAVINGS_DEFAULTS, {}, savingsQuickResult(example)),
    exampleNote: `Example: a ${formatCurrency(example.target)} goal with ${formatCurrency(input.currentSavings)} saved so far, ${formatPercent(input.apy)} APY and ${formatDuration(input.months)} to save (illustrative figures, not current rates). Enter your numbers to update.`,
    results: savingsGoalResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="monthly-heading">
    <h2 id="monthly-heading">How much to save each month</h2>
    <p>Without interest, the monthly amount is simply what is left to save divided by the months you have: ${formatCurrency(example.target - input.currentSavings)}
    ÷ ${input.months} = ${formatCurrency(noInterest.monthlyContribution)}. Interest lowers it: at ${formatPercent(input.apy)} APY the example needs
    ${formatCurrency(example.monthlyContribution)} a month, because the balance earns ${formatCurrency(example.interest)} along the way. More time lowers it
    further: over ${formatDuration(fiveYears.months)} it is ${formatCurrency(fiveYears.monthlyContribution)} a month.</p>
  </section>

  <section class="content-section" aria-labelledby="emergency-heading">
    <h2 id="emergency-heading">Sizing an emergency fund</h2>
    <p>An emergency fund is cash set aside for unplanned costs such as car or home repairs, medical bills or a loss of income
    (<a href="${SOURCES.emergencyFund.url}">CFPB: building an emergency fund</a>). Choose <strong>An emergency fund</strong> and the goal becomes your
    essential monthly expenses times the months you want covered. With ${formatCurrency(emergency.input.monthlyExpenses)} a month and
    ${emergency.input.coverageMonths} months, that is ${formatCurrency(emergency.target)}, or ${formatCurrency(emergency.monthlyContribution)} a month over
    ${formatDuration(emergency.months)} from the example's starting balance. Three to six months of expenses is a common rule of thumb, not a requirement;
    even a small fund helps, and a specific goal with automatic transfers makes it easier to keep saving.</p>
  </section>

  <section class="content-section" aria-labelledby="savings-how-heading">
    <h2 id="savings-how-heading">How the calculation works</h2>
    <ol>
      <li>APY is the yearly return including compounding (<a href="${SOURCES.apyDefinition.url}">Truth in Savings definition</a>). The monthly rate is
      r = (1 + APY)<sup>1/12</sup> − 1, so a balance left alone for a year grows by exactly the APY.</li>
      <li>Monthly amount to reach goal G in n months from savings S: <code>(G − S × (1 + r)<sup>n</sup>) × r ÷ ((1 + r)<sup>n</sup> − 1)</code>,
      or (G − S) ÷ n with no interest.</li>
      <li>Time with a set deposit: the balance is grown month by month, with the deposit added at the end of each month, until it reaches the goal.</li>
    </ol>
  </section>

  <section class="content-section" aria-labelledby="savings-assumptions-heading">
    <h2 id="savings-assumptions-heading">What this calculator does not include</h2>
    <ul>
      <li>Changes in your account's rate. Savings rates are variable; the result assumes today's APY for the whole period.</li>
      <li>Taxes on interest, fees, withdrawals and inflation.</li>
      <li>Investment returns. For money in the market, returns are not guaranteed and can be negative.</li>
    </ul>
    <p>Results are estimates, not financial advice.</p>
  </section>

  <section class="content-section" aria-labelledby="savings-method-heading">
    <h2 id="savings-method-heading">Methodology and testing</h2>
    <p>Automated tests compare the monthly amounts with an independent implementation of the closed form, check that a balance at the APY grows by
    exactly that rate in a year, and check for 300 varied plans that the solved deposit reaches the goal in exactly the chosen month.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection([SOURCES.emergencyFund, SOURCES.apyDefinition])}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/savings-goal.js']
  };
}
