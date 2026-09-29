/**
 * Results panel for the Student Loan Refinance Calculator. Pure function of
 * the view model from src/adapters/student-loan-refinance.js.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatDuration } from '../lib/format.js';
import { statGrid, dataTable } from './results.js';

/**
 * Official links shown in the live results. content/sources.js is server-only,
 * so the URLs are repeated here; a test keeps them identical to the registry.
 */
export const RESULT_LINKS = Object.freeze({
  studentLoanRefinance: 'https://www.consumerfinance.gov/ask-cfpb/should-i-consolidate-refinance-student-loans-en-561/',
  loanSimulator: 'https://studentaid.gov/loan-simulator/repayment'
});

const signed = (value) => `${value >= 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;

function paymentChange(view) {
  const change = view.monthlySavings;
  if (Math.abs(change) < 0.005) return { label: 'Monthly payment change', value: formatCurrency(0), note: 'Same payment' };
  return change > 0
    ? { label: 'Monthly savings', value: formatCurrency(change), note: `Down from ${formatCurrency(view.current.payment)}` }
    : { label: 'Monthly payment increase', value: formatCurrency(-change), note: `Up from ${formatCurrency(view.current.payment)}` };
}

function payoffChange(view) {
  if (view.extraMonths === 0) return { label: 'Payoff date', value: 'Unchanged', note: `${formatDuration(view.refinance.months)} left either way` };
  return view.extraMonths > 0
    ? { label: 'Payoff date', value: `${formatDuration(view.extraMonths)} later`, note: `${formatDuration(view.refinance.months)} instead of ${formatDuration(view.current.months)}` }
    : { label: 'Payoff date', value: `${formatDuration(-view.extraMonths)} sooner`, note: `${formatDuration(view.refinance.months)} instead of ${formatDuration(view.current.months)}` };
}

function summary(view) {
  return statGrid([
    { label: 'New monthly payment', value: formatCurrency(view.refinance.payment), primary: true, note: `Over ${formatDuration(view.refinance.months)}` },
    paymentChange(view),
    { label: 'Total savings', value: signed(view.lifetimeSavings), note: 'Both options run to payoff, fees included' },
    payoffChange(view)
  ]);
}

/** Shown whenever the loans are federal: the protections are not in the numbers. */
function federalWarning(view) {
  if (!view.input.federal) return '';
  return html`<div class="callout callout--warning">
  <p><strong>Refinancing federal student loans with a private lender cannot be undone.</strong> The new private loan does not keep the federal
  loans' benefits and protections, such as federal repayment plans based on income, forgiveness programs, and federal deferment and forbearance options
  (<a href="${RESULT_LINKS.studentLoanRefinance}">CFPB</a>). The savings above do not put a value on those.</p>
  <p>Compare federal repayment plans first with the <a href="${RESULT_LINKS.loanSimulator}">Loan Simulator</a> from Federal Student Aid.</p>
</div>`;
}

function verdictNote(view) {
  if (view.lifetimeSavings < 0 && view.monthlySavings > 0) {
    return html`<p class="callout callout--warning"><strong>Lower payment, higher total cost.</strong> Stretching the loan over
    ${formatDuration(view.refinance.months)} costs ${formatCurrency(-view.lifetimeSavings)} more in total. At the same
    ${formatDuration(view.current.months)} you have left, the new rate would ${view.sameTerm.lifetimeSavings >= 0 ? html`save <strong>${formatCurrency(view.sameTerm.lifetimeSavings)}</strong>` : `cost ${formatCurrency(-view.sameTerm.lifetimeSavings)} more`}.</p>`;
  }
  if (view.lifetimeSavings < 0) {
    return html`<p class="callout callout--warning"><strong>This offer costs ${formatCurrency(-view.lifetimeSavings)} more than keeping your loans.</strong></p>`;
  }
  return html`<p class="callout">Refinancing saves <strong>${formatCurrency(view.lifetimeSavings)}</strong> in total if both options run to payoff.</p>`;
}

function comparison(view) {
  return dataTable({
    id: 'slr-compare',
    title: 'Keep your loans vs. refinance, run to payoff',
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'current', label: 'Keep current loans', numeric: true },
      { key: 'refinance', label: 'Refinance', numeric: true }
    ],
    rows: [
      { item: 'Monthly payment', current: formatCurrency(view.current.payment), refinance: formatCurrency(view.refinance.payment) },
      { item: 'Time to pay off', current: formatDuration(view.current.months), refinance: formatDuration(view.refinance.months) },
      { item: 'Total interest', current: formatCurrency(view.current.totalInterest), refinance: formatCurrency(view.refinance.totalInterest) },
      { item: 'Fees', current: formatCurrency(0), refinance: formatCurrency(view.input.fees) },
      { item: 'Total cost to payoff', current: formatCurrency(view.current.totalCost), refinance: formatCurrency(view.refinance.totalCost), selected: true }
    ]
  });
}

function options(view) {
  return dataTable({
    id: 'slr-terms',
    title: 'The new rate over common terms',
    columns: [
      { key: 'term', label: 'Term' },
      { key: 'payment', label: 'Monthly payment', numeric: true },
      { key: 'interest', label: 'Total interest', numeric: true },
      { key: 'savings', label: 'Total savings vs. keeping', numeric: true }
    ],
    rows: view.options.map((row) => ({
      term: `${formatDuration(row.termMonths)}${row.selected ? ' (your offer)' : row.current ? ' (time you have left)' : ''}`,
      payment: formatCurrency(row.payment),
      interest: formatCurrency(row.totalInterest),
      savings: signed(row.lifetimeSavings),
      selected: row.selected
    }))
  });
}

export function studentLoanRefinanceResults(view) {
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your refinance estimate</h2>
  ${summary(view)}
  ${federalWarning(view)}
  ${verdictNote(view)}
  <p class="note">Fixed rates on both sides, principal and interest only. A variable-rate offer's payment can change.</p>
</section>
<section class="result-block" aria-labelledby="compare-heading">
  <h2 id="compare-heading">Keep vs. refinance</h2>
  ${comparison(view)}
</section>
<section class="result-block" aria-labelledby="terms-heading">
  <h2 id="terms-heading">Choosing a term</h2>
  <p class="note">A shorter term raises the payment but cuts total interest. Savings compare each term with keeping your current loans; part of the saving on
  shorter terms comes from paying off sooner, which extra payments on your current loans could also do.</p>
  ${options(view)}
</section>`;
}

export function studentLoanRefinanceQuickResult(view) {
  return html`<strong>${formatCurrency(view.refinance.payment)}</strong>/month · total savings ${signed(view.lifetimeSavings)}.
  <a href="#summary-heading">See full results</a>`;
}

export function studentLoanRefinanceAnnouncement(view) {
  const federal = view.input.federal ? ' Refinancing federal loans gives up federal benefits and protections.' : '';
  return `New monthly payment ${formatCurrency(view.refinance.payment)}. Total savings ${signed(view.lifetimeSavings)}.${federal}`;
}
