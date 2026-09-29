/**
 * Results panel for the Auto Loan Calculator: the amount-financed bridge and
 * negative-equity warning, plus the shared amortized-loan sections.
 */

import { html } from '../lib/html.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../lib/format.js';
import { dataTable } from './results.js';
import {
  summaryBlock, extraPaymentBlock, termComparisonBlock, scheduleBlock, quickResult, announcement
} from './amortized-results.js';

function taxLabel(purchase) {
  if (purchase.salesTaxRate === 0) return 'Sales tax';
  const base = purchase.taxAfterTradeIn && purchase.tradeInValue > 0 ? 'price minus trade-in' : 'full price';
  return `Sales tax (${formatPercent(purchase.salesTaxRate, 3)} of ${base})`;
}

/** How the amount financed is built, line by line. */
function amountFinancedBridge(purchase) {
  const rows = [
    { item: 'Vehicle price', amount: formatCurrency(purchase.vehiclePrice) },
    { item: taxLabel(purchase), amount: `+ ${formatCurrency(purchase.salesTax)}` },
    { item: 'Fees', amount: `+ ${formatCurrency(purchase.fees)}` },
    { item: 'Down payment', amount: `− ${formatCurrency(purchase.downPayment)}` }
  ];
  if (purchase.tradeInValue > 0 || purchase.tradeInPayoff > 0) {
    rows.push(purchase.netTradeIn >= 0
      ? { item: 'Trade-in equity (value − amount owed)', amount: `− ${formatCurrency(purchase.netTradeIn)}` }
      : { item: 'Negative equity rolled into the loan', amount: `+ ${formatCurrency(-purchase.netTradeIn)}` });
  }
  rows.push({ item: 'Amount financed', amount: formatCurrency(purchase.amountFinanced), selected: true });

  return html`<section class="result-block" aria-labelledby="financed-heading">
  <h2 id="financed-heading">How much you are borrowing</h2>
  ${dataTable({
    id: 'financed-table',
    title: 'Amount financed',
    columns: [{ key: 'item', label: 'Item' }, { key: 'amount', label: 'Amount', numeric: true }],
    rows
  })}
</section>`;
}

function negativeEquityWarning(purchase) {
  if (purchase.netTradeIn >= 0) return '';
  return html`<p class="callout callout--warning"><strong>Negative equity:</strong> you owe
  ${formatCurrency(-purchase.netTradeIn)} more on your trade-in than it is worth. That amount is added to the new loan,
  so you pay interest on it and start the new loan owing more than this car's price.</p>`;
}

function budgetLead(view) {
  if (!view.budget) return '';
  const { purchase } = view;
  return html`<p class="callout">A <strong>${formatCurrency(view.budget.monthlyBudget)}</strong> monthly payment at ${formatPercent(view.input.annualRate, 3)} APR
  for ${view.input.termMonths} months supports a car price of about <strong>${formatCurrencyWhole(view.budget.vehiclePrice)}</strong>, after
  ${formatCurrency(purchase.salesTax)} of sales tax and ${formatCurrency(purchase.fees)} of fees${purchase.downPayment > 0 ? html`, with ${formatCurrency(purchase.downPayment)} down` : ''}.
  The loan below is for that price.</p>`;
}

export function autoLoanResults(view) {
  const { purchase } = view;
  return html`${summaryBlock(view, {
    lead: html`${budgetLead(view)}${negativeEquityWarning(purchase)}`,
    principalLabel: 'Amount financed',
    rateLabel: 'APR',
    extraStats: [
      { label: 'Amount financed', value: formatCurrency(purchase.amountFinanced) },
      { label: 'Car cost with tax, fees and interest', value: formatCurrency(purchase.carCostWithInterest) }
    ],
    note: 'Loan payments only. Insurance, registration renewals, fuel and maintenance are not included.'
  })}
${amountFinancedBridge(purchase)}
${extraPaymentBlock(view)}
${termComparisonBlock(view, {
    title: 'Same purchase and APR over common auto-loan terms',
    note: 'Longer terms lower the payment but add interest, and the balance falls more slowly.'
  })}
${scheduleBlock(view)}`;
}

export function autoQuickResult(view) {
  if (!view.budget) return quickResult(view);
  return html`A car price of about <strong>${formatCurrencyWhole(view.budget.vehiclePrice)}</strong> fits ${formatCurrency(view.budget.monthlyBudget)}/month.
  <a href="#summary-heading">See full results</a>`;
}

export function autoAnnouncement(view) {
  if (!view.budget) return announcement(view);
  return `A car price of about ${formatCurrencyWhole(view.budget.vehiclePrice)} fits a ${formatCurrency(view.budget.monthlyBudget)} monthly payment. ${announcement(view)}`;
}
