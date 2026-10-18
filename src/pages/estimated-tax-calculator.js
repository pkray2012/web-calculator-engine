/**
 * Estimated Tax Calculator page (draft: registry status "planned", not built
 * into the site until its sources are verified directly). Example results and
 * every worked figure are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency as formatRounded } from '../lib/format.js';
import { estimatedTaxForm } from '../components/estimated-tax-form.js';
import { estimatedTaxResults, estimatedTaxQuickResult, formatDueDate } from '../components/estimated-tax-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { ESTIMATED_TAX_DEFAULTS, parseEstimatedTaxForm, buildEstimatedTaxView } from '../adapters/estimated-tax.js';
import { calculateEstimatedTax } from '../calculators/estimated-tax.js';
import { roundCents } from '../calculators/sales-tax.js';
import { findCalculator, relatedCalculators } from '../content/site.js';

const formatCurrency = (value) => formatRounded(roundCents(value));
const IRS = 'Internal Revenue Service';

/**
 * Pending direct verification: these rules and the 2026 due dates were checked
 * only through search-result summaries of the IRS pages. Move them to
 * src/content/sources.js once their content has been read directly.
 */
export const ESTIMATED_TAX_SOURCES = Object.freeze({
  form1040es: {
    title: 'Form 1040-ES, Estimated Tax for Individuals (2026)',
    publisher: IRS,
    url: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf',
    supports: 'Estimated tax is generally required if you expect to owe at least $1,000 after withholding and refundable credits; the required annual payment is the smaller of 90% of this year’s tax or 100% of last year’s (110% if last year’s AGI was over $150,000, or $75,000 if married filing separately); 2026 payments are due April 15, June 15 and September 15, 2026 and January 15, 2027.'
  },
  pub505: {
    title: 'Publication 505, Tax Withholding and Estimated Tax',
    publisher: IRS,
    url: 'https://www.irs.gov/publications/p505',
    supports: 'Withholding is treated as paid evenly through the year unless you elect otherwise; no penalty applies if you had no tax liability for the prior full 12-month year as a U.S. citizen or resident.'
  },
  underpayment: {
    title: 'Underpayment of estimated tax by individuals penalty',
    publisher: IRS,
    url: 'https://www.irs.gov/payments/underpayment-of-estimated-tax-by-individuals-penalty',
    supports: 'The penalty is figured separately for each installment period, so paying late in the year does not fully cure an earlier shortfall.'
  }
});

export function estimatedTaxPage() {
  const calculator = findCalculator('estimated-tax-calculator');
  const example = buildEstimatedTaxView(parseEstimatedTaxForm(ESTIMATED_TAX_DEFAULTS).input);
  const r = example.result;
  const high = calculateEstimatedTax({ ...example.input, priorYearAgi: 200000 });

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out how much federal estimated tax to pay each quarter to avoid the underpayment penalty, using the IRS safe-harbor rules,
  and how much to pay if you would rather owe nothing when you file. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your taxes',
    form: estimatedTaxForm(ESTIMATED_TAX_DEFAULTS, {}, estimatedTaxQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(r.currentYearTax)} of expected tax this year with ${formatCurrency(r.withholding)} withheld, and ${formatCurrency(r.priorYearTax)} of tax last year. Enter your own figures to update.`,
    results: estimatedTaxResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="est-who-heading">
    <h2 id="est-who-heading">Who needs to pay estimated tax</h2>
    <p>Tax is due as you earn income. Employers withhold it from wages, but nobody withholds from self-employment, rental or investment income, so you
    pay it yourself in four installments. In general you need to make estimated payments if you expect to owe $1,000 or more when you file, after
    withholding and refundable credits.</p>
  </section>

  <section class="content-section" aria-labelledby="est-harbor-heading">
    <h2 id="est-harbor-heading">The safe-harbor rules</h2>
    <p>You avoid the underpayment penalty if, by each due date, withholding and estimated payments together cover a quarter of the smaller of:</p>
    <ul>
      <li>90% of this year's tax, or</li>
      <li>100% of last year's tax, or 110% if last year's adjusted gross income was over $150,000 ($75,000 if married filing separately).</li>
    </ul>
    <p>In the example, 90% of this year's ${formatCurrency(r.currentYearTax)} is ${formatCurrency(r.currentYearTest)} and last year's tax was ${formatCurrency(r.priorYearTax)},
    so the required payment is ${formatCurrency(r.requiredAnnualPayment)}. After ${formatCurrency(r.withholding)} of withholding, that is ${formatCurrency(r.safeHarborTotal)} in
    estimated payments, or ${formatCurrency(r.safeHarborInstallment)} a quarter. If last year's AGI had been $200,000, the 110% rule would make it
    ${formatCurrency(high.safeHarborInstallment)} a quarter.</p>
    <p>Last year's tax is usually the easier target, because it is a known number. The safe harbor avoids the penalty, not the tax: whatever is
    left, ${formatCurrency(r.dueAtFilingWithSafeHarbor)} in the example, is still due when you file.</p>
  </section>

  <section class="content-section" aria-labelledby="est-dates-heading">
    <h2 id="est-dates-heading">${r.taxYear} due dates</h2>
    <p>${r.dueDates.map(formatDueDate).join('; ')}. The penalty is figured separately for each period, so a large payment in January does not
    fully make up for skipping April. You can pay online through the IRS or mail a payment with a Form 1040-ES voucher.</p>
  </section>

  <section class="content-section" aria-labelledby="est-assumptions-heading">
    <h2 id="est-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Federal estimated tax only. Most states with an income tax have their own estimated payments and rules.</li>
      <li>This year's tax is your own estimate; this calculator does not work out income tax. Last year's return and your year-to-date income are a
      good starting point.</li>
      <li>Payments are split into four equal installments. If your income arrives unevenly, the annualized income installment method on Form 2210
      can lower early payments; it is not calculated here.</li>
      <li>Farmers and fishermen have different rules, and the no-penalty rule for zero tax last year requires a full 12-month tax year as a U.S. citizen
      or resident.</li>
      <li>This is an estimate, not tax advice.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="est-method-heading">
    <h2 id="est-method-heading">Methodology and testing</h2>
    <p>Required payment = the smaller of 90% of this year's tax and 100% or 110% of last year's tax; estimated payments = that amount minus
    withholding, in four equal parts. Automated tests check hand-worked examples, the $150,000 and $75,000 AGI limits, the $1,000 threshold, a zero
    tax year, and 2,000 random cases. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection(Object.values(ESTIMATED_TAX_SOURCES))}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/estimated-tax.js']
  };
}
