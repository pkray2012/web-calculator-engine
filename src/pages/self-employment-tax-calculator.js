/**
 * Self-Employment Tax Calculator page (draft: registry status "planned", not
 * built into the site until its sources are verified directly). Example
 * results and every worked figure are computed from the engine at build time.
 */

import { html } from '../lib/html.js';
import { formatCurrency as formatRounded } from '../lib/format.js';
import { roundCents } from '../calculators/sales-tax.js';
import { selfEmploymentTaxForm } from '../components/self-employment-tax-form.js';
import { selfEmploymentTaxResults, selfEmploymentTaxQuickResult } from '../components/self-employment-tax-results.js';
import { relatedLinks, sourcesSection } from '../components/layout.js';
import { calculatorShell } from '../components/calculator-shell.js';
import { dataTable } from '../components/results.js';
import { SE_TAX_DEFAULTS, parseSelfEmploymentTaxForm, buildSelfEmploymentTaxView } from '../adapters/self-employment-tax.js';
import { calculateSelfEmploymentTax, SOCIAL_SECURITY_WAGE_BASE, TAX_YEARS } from '../calculators/self-employment-tax.js';
import { findCalculator, relatedCalculators } from '../content/site.js';

const IRS = 'Internal Revenue Service';

// Half-up to the cent, matching the results panel.
const formatCurrency = (value) => formatRounded(roundCents(value));

/**
 * Read directly by the Codex audit on 2026-10-18 (audit/codex-vm-20261018):
 * the 2025 Schedule SE and Form 8959 instructions ($400 threshold, $176,100
 * 2025 wage base, 0.9% rate and filing-status thresholds) and Topics 554 and
 * 751 (rates, 92.35%, the $184,500 2026 wage base). Kept page-local while the
 * page is a draft; move to src/content/sources.js when it goes live.
 */
export const SE_TAX_SOURCES = Object.freeze({
  scheduleSeInstructions: {
    title: 'Instructions for Schedule SE (Form 1040)',
    publisher: IRS,
    url: 'https://www.irs.gov/instructions/i1040sse',
    supports: 'Net earnings from self-employment are 92.35% of net profit; no SE tax is due when they are under $400; Social Security tax applies up to the wage base minus W-2 Social Security wages; half of SE tax is deductible.'
  },
  topic554: {
    title: 'Topic no. 554, Self-employment tax',
    publisher: IRS,
    url: 'https://www.irs.gov/taxtopics/tc554',
    supports: 'The self-employment tax rate is 15.3%: 12.4% for Social Security and 2.9% for Medicare.'
  },
  form8959Instructions: {
    title: 'Instructions for Form 8959, Additional Medicare Tax',
    publisher: IRS,
    url: 'https://www.irs.gov/instructions/i8959',
    supports: 'A 0.9% Additional Medicare Tax applies to self-employment income above $200,000 (single, head of household, qualifying surviving spouse), $250,000 (married filing jointly) or $125,000 (married filing separately), reduced by Medicare wages; the thresholds are not indexed.'
  },
  topic751: {
    title: 'Topic no. 751, Social Security and Medicare withholding rates',
    publisher: IRS,
    url: 'https://www.irs.gov/taxtopics/tc751',
    supports: 'The maximum amount of 2026 earnings subject to Social Security tax is $184,500.'
  }
});

const TABLE_PROFITS = [10000, 25000, 50000, 75000, 100000, 150000, 200000, 300000];

function exampleView(overrides = {}) {
  return buildSelfEmploymentTaxView(parseSelfEmploymentTaxForm({ ...SE_TAX_DEFAULTS, ...overrides }).input);
}

export function selfEmploymentTaxPage() {
  const calculator = findCalculator('self-employment-tax-calculator');
  const example = exampleView();
  const r = example.result;
  const year = r.taxYear;
  const mixed = calculateSelfEmploymentTax({ taxYear: year, netProfit: 150000, socialSecurityWages: 100000 });
  const high = calculateSelfEmploymentTax({ taxYear: year, netProfit: 250000 });
  const small = calculateSelfEmploymentTax({ taxYear: year, netProfit: 400 });
  const sources = Object.values(SE_TAX_SOURCES);

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  <p class="lede">Work out the Social Security and Medicare tax you owe on freelance, gig or small-business profit, the half you can deduct,
  and the 0.9% Additional Medicare Tax on that profit. Wages from a job are taken into account. Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your income',
    form: selfEmploymentTaxForm(SE_TAX_DEFAULTS, {}, selfEmploymentTaxQuickResult(example)),
    exampleNote: `Example: ${formatCurrency(r.netProfit)} of net profit in ${year} with no W-2 job. Enter your own figures to update.`,
    results: selfEmploymentTaxResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="se-what-heading">
    <h2 id="se-what-heading">What self-employment tax is</h2>
    <p>Employees split Social Security and Medicare tax with their employer: each pays 7.65% of wages. When you work for yourself you pay
    both halves, a combined 15.3%: 12.4% for Social Security and 2.9% for Medicare. It is figured on Schedule SE and is owed on top of
    income tax, so it applies even when you owe no income tax.</p>
  </section>

  <section class="content-section" aria-labelledby="se-how-heading">
    <h2 id="se-how-heading">How to calculate self-employment tax</h2>
    <ol>
      <li>Multiply net profit by 92.35% to get net earnings from self-employment: ${formatCurrency(r.netProfit)} × 0.9235 = ${formatCurrency(r.netEarnings)}.
      The 92.35% stands in for the employer half that an employee never pays tax on.</li>
      <li>Social Security: 12.4% of net earnings, up to the year's wage base (${formatCurrency(r.wageBase)} for ${year}):
      ${formatCurrency(r.netEarnings)} × 0.124 = ${formatCurrency(r.socialSecurityTax)}.</li>
      <li>Medicare: 2.9% of all net earnings: ${formatCurrency(r.netEarnings)} × 0.029 = ${formatCurrency(r.medicareTax)}.</li>
      <li>Add them: ${formatCurrency(r.selfEmploymentTax)} of self-employment tax. Half of it, ${formatCurrency(r.deductibleHalf)}, is deducted when figuring
      adjusted gross income.</li>
    </ol>
    <p class="formula"><code>SE tax = 12.4% × min(0.9235 × profit, wage base left) + 2.9% × 0.9235 × profit</code></p>
    <p>If net earnings are under $400, no self-employment tax is due. ${formatCurrency(small.netProfit)} of profit gives ${formatCurrency(small.rawNetEarnings)} of net
    earnings, which is under that line.</p>
  </section>

  <section class="content-section" aria-labelledby="se-w2-heading">
    <h2 id="se-w2-heading">If you also have a W-2 job</h2>
    <p>Social Security tax stops at the wage base, and wages from a job count first. With ${formatCurrency(mixed.socialSecurityWages)} of W-2 wages and
    ${formatCurrency(mixed.netProfit)} of profit in ${year}, only ${formatCurrency(mixed.wageBaseLeft)} of the wage base is left, so Social Security tax on the side
    business is ${formatCurrency(mixed.socialSecurityTax)} instead of ${formatCurrency(mixed.netEarnings * 0.124)}. Medicare tax has no cap:
    ${formatCurrency(mixed.medicareTax)}.</p>
  </section>

  <section class="content-section" aria-labelledby="se-addl-heading">
    <h2 id="se-addl-heading">The 0.9% Additional Medicare Tax</h2>
    <p>Above ${formatCurrency(200000)} (single, head of household or qualifying surviving spouse), ${formatCurrency(250000)} (married filing jointly) or
    ${formatCurrency(125000)} (married filing separately), an extra 0.9% applies to self-employment income, and W-2 Medicare wages use up the threshold
    first. It is reported on Form 8959, is not part of self-employment tax and is not deductible. A single filer with ${formatCurrency(high.netProfit)} of
    profit and no job pays ${formatCurrency(high.additionalMedicareTax)}; in the W-2 example above it is ${formatCurrency(mixed.additionalMedicareTax)}. These
    thresholds are not adjusted for inflation.</p>
  </section>

  <section class="content-section" aria-labelledby="se-table-heading">
    <h2 id="se-table-heading">Self-employment tax at common profit levels (${year}, no W-2 wages, single)</h2>
    ${dataTable({
      id: 'se-table',
      title: `Self-employment tax by net profit, ${year}`,
      columns: [
        { key: 'profit', label: 'Net profit' },
        { key: 'tax', label: 'SE tax', numeric: true },
        { key: 'half', label: 'Deductible half', numeric: true },
        { key: 'addl', label: 'Additional Medicare', numeric: true }
      ],
      rows: TABLE_PROFITS.map((netProfit) => {
        const row = calculateSelfEmploymentTax({ taxYear: year, netProfit });
        return {
          profit: formatCurrency(netProfit),
          tax: formatCurrency(row.selfEmploymentTax),
          half: formatCurrency(row.deductibleHalf),
          addl: formatCurrency(row.additionalMedicareTax)
        };
      })
    })}
  </section>

  <section class="content-section" aria-labelledby="se-pay-heading">
    <h2 id="se-pay-heading">Paying it during the year</h2>
    <p>Nobody withholds self-employment tax for you, so it is usually paid with income tax through quarterly estimated payments. This calculator works
    out the self-employment part only. Your total estimated tax also needs your income tax, which depends on your other income, deductions and credits.</p>
  </section>

  <section class="content-section" aria-labelledby="se-assumptions-heading">
    <h2 id="se-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Uses the regular Schedule SE method for tax years ${TAX_YEARS.join(' and ')}, with Social Security wage bases of
      ${TAX_YEARS.map((y) => `${formatCurrency(SOCIAL_SECURITY_WAGE_BASE[y])} (${y})`).join(' and ')}.</li>
      <li>Social Security wages are W-2 boxes 3 and 7; Medicare wages are box 5. If you leave Medicare wages blank, they are taken to be the same as
      Social Security wages, which is wrong if your job was not covered by Social Security or paid more than the wage base.</li>
      <li>Only the Additional Medicare Tax on self-employment income is calculated. If your wages alone are above the threshold, the 0.9% on those
      wages (Form 8959 Part I) is not included.</li>
      <li>Not covered: the farm and nonfarm optional methods, church employee income, Conservation Reserve Program payments, income tax and state taxes.</li>
      <li>For married couples, self-employment tax is figured separately for each spouse with business income, and only your own wages reduce your
      Social Security wage base. On a joint return, your spouse's wages count toward the $250,000 Additional Medicare Tax threshold. If both spouses
      have self-employment income, their combined income is tested against that threshold, which this calculator does not combine: its Additional
      Medicare figure can then be too low.</li>
      <li>This is an estimate, not tax advice. Your tax return or a tax professional may calculate differently.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="se-method-heading">
    <h2 id="se-method-heading">Methodology and testing</h2>
    <p>The calculation follows the Schedule SE regular method and Form 8959 Part II line by line. Automated tests check hand-worked examples, the
    $400 minimum, the wage-base cap with and without W-2 wages, each filing status threshold, losses, and 2,000 random cases against an independent
    line-by-line reference. <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${sourcesSection(sources)}

  ${relatedLinks(relatedCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    scripts: ['client/self-employment-tax.js']
  };
}
