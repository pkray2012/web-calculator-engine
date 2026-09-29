/**
 * Shared view model for any fixed-rate amortizing loan result.
 * Calculator adapters call their engine, then hand the calculateLoan()-shaped
 * result here so every loan page renders the same summary, extra-payment,
 * term-comparison and schedule sections.
 */

import { paymentMonth } from '../lib/format.js';

/** Group a monthly schedule into loan years (payments 1–12, 13–24, …). */
export function summarizeByYear(schedule) {
  const years = [];
  for (const row of schedule) {
    const index = Math.floor((row.month - 1) / 12);
    if (!years[index]) years[index] = { year: index + 1, payment: 0, principal: 0, interest: 0, balance: 0 };
    const year = years[index];
    year.payment += row.payment;
    year.principal += row.principal;
    year.interest += row.interest;
    year.balance = row.balance;
  }
  return years;
}

/**
 * loan: output of calculateLoan() (or an engine that spreads it).
 * input: { principal, annualRate, termMonths, extraMonthly, startMonth }.
 * termComparison: [{ termMonths, monthlyPayment, totalInterest, selected }].
 */
export function amortizedView({ loan, input, termComparison }) {
  const { principal, annualRate, termMonths, extraMonthly = 0, startMonth = null } = input;
  const hasExtra = extraMonthly > 0;
  const plan = hasExtra ? loan.accelerated : null;
  const schedule = hasExtra ? loan.accelerated.schedule : loan.schedule;
  const payoff = (payments) => (startMonth ? paymentMonth(startMonth, payments) : null);

  return {
    input: { principal, annualRate, termMonths, extraMonthly, startMonth },
    monthlyPayment: loan.monthlyPayment,
    totalInterest: loan.totalInterest,
    totalRepayment: loan.totalRepayment,
    payments: loan.scheduledPayments,
    finalPayment: loan.schedule.at(-1).payment,
    payoff: payoff(loan.scheduledPayments),
    principalShare: principal / loan.totalRepayment,
    extra: hasExtra ? {
      amount: extraMonthly,
      monthlyPayment: plan.monthlyPayment,
      payments: plan.payments,
      totalInterest: plan.totalInterest,
      totalRepayment: plan.totalRepayment,
      interestSaved: plan.interestSaved,
      paymentsSaved: plan.paymentsSaved,
      finalPayment: plan.schedule.at(-1).payment,
      payoff: payoff(plan.payments)
    } : null,
    termComparison,
    schedule: {
      basis: hasExtra ? 'with-extra' : 'scheduled',
      monthly: schedule,
      yearly: summarizeByYear(schedule)
    }
  };
}
