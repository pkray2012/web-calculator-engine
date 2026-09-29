/**
 * Results panel for the 401(k) Calculator. Pure function of the view model
 * from src/adapters/retirement-401k.js.
 */

import { html } from '../lib/html.js';
import { formatCurrencyWhole } from '../lib/format.js';
import { statGrid, dataTable, breakdownBar } from './results.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function percent(value) {
  return `${Number(value.toFixed(2))}%`;
}

/** A one-line verdict on whether the employee captures the full match. */
function matchNote(view) {
  const { input } = view;
  if (view.fullMatchPercent === 0) return 'No employer match entered.';
  if (view.firstYearMatchMissed < 0.5) return `You get the full match: ${percent(view.fullMatchPercent)} of pay.`;
  const limited = view.schedule[0].limitMonth !== null && input.contributionPercent >= view.deferralForFullMatch;
  if (limited) return `You reach the IRS limit early, so about ${formatCurrencyWhole(view.firstYearMatchMissed)} of match is lost unless your plan makes a year-end true-up.`;
  return `Contributing ${percent(view.deferralForFullMatch)} of pay would add about ${formatCurrencyWhole(view.firstYearMatchMissed)} of employer money this year.`;
}

export function retirement401kResults(view) {
  const { input } = view;
  const first = view.schedule[0];
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your 401(k) at ${input.retirementAge}</h2>
  ${statGrid([
    { label: 'Balance at retirement', value: formatCurrencyWhole(view.balance), primary: true, note: `After ${view.years} years, before income tax` },
    { label: 'In today’s dollars', value: formatCurrencyWhole(view.realBalance), note: `At ${input.inflation}% a year inflation` },
    { label: 'Your contributions', value: formatCurrencyWhole(view.employeeTotal), note: `${formatCurrencyWhole(view.firstYearEmployee)} this year` },
    { label: 'Employer contributions', value: formatCurrencyWhole(view.employerTotal), note: matchNote(view) },
    { label: 'Investment growth', value: formatCurrencyWhole(view.growth), note: `At ${input.annualReturn}% a year` },
    ...(first.limitMonth !== null ? [{ label: 'IRS limit reached', value: MONTHS[first.limitMonth - 1], note: `This year's limit for age ${first.age} is ${formatCurrencyWhole(first.limit)}` }] : [])
  ])}
  ${breakdownBar({
    label: 'Where the balance comes from',
    parts: [
      ...(input.currentBalance > 0 ? [{ label: 'Current balance', amount: input.currentBalance, display: formatCurrencyWhole(input.currentBalance) }] : []),
      { label: 'Your contributions', amount: view.employeeTotal, display: formatCurrencyWhole(view.employeeTotal) },
      { label: 'Employer contributions', amount: view.employerTotal, display: formatCurrencyWhole(view.employerTotal) },
      { label: 'Investment growth', amount: Math.max(0, view.growth), display: formatCurrencyWhole(view.growth) }
    ]
  })}
  ${dataTable({
    id: 'rk-schedule',
    title: 'Year by year',
    columns: [
      { key: 'age', label: 'Age' },
      { key: 'salary', label: 'Salary', numeric: true },
      { key: 'employee', label: 'You', numeric: true },
      { key: 'employer', label: 'Employer', numeric: true },
      { key: 'balance', label: 'Balance', numeric: true }
    ],
    rows: view.schedule.map((row) => ({
      age: String(row.age),
      salary: formatCurrencyWhole(row.salary),
      employee: formatCurrencyWhole(row.employee),
      employer: formatCurrencyWhole(row.employer),
      balance: formatCurrencyWhole(row.balance)
    }))
  })}
  <p class="note">An illustration at a constant return, not a forecast. Investment returns vary and can be negative, and the IRS limits are held at their
  2026 amounts. Withdrawals are generally taxed as income.</p>
</section>`;
}

export function retirement401kQuickResult(view) {
  return html`<strong>${formatCurrencyWhole(view.balance)}</strong> at age ${view.input.retirementAge}. <a href="#summary-heading">See full results</a>`;
}

export function retirement401kAnnouncement(view) {
  return `At age ${view.input.retirementAge}: about ${formatCurrencyWhole(view.balance)} in your 401(k), or ${formatCurrencyWhole(view.realBalance)} in today's dollars.`;
}
