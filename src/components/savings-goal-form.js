/**
 * Savings Goal Calculator form. Only the inputs for the selected goal type and
 * plan are shown (CSS :has), so no page-specific script is needed.
 */

import { html } from '../lib/html.js';
import { numberField, amountWithUnitField, radioField } from './fields.js';
import { SAVINGS_DEFAULTS } from '../adapters/savings-goal.js';

export const SAVINGS_FIELD_IDS = Object.freeze({
  goalType: 'savings-goal-type',
  goalAmount: 'savings-goal',
  monthlyExpenses: 'savings-expenses',
  coverageMonths: 'savings-coverage',
  currentSavings: 'savings-current',
  apy: 'savings-apy',
  plan: 'savings-plan',
  timeValue: 'savings-time',
  monthlyDeposit: 'savings-deposit'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function savingsGoalForm(values = SAVINGS_DEFAULTS, errors = {}, quick = null) {
  const ids = SAVINGS_FIELD_IDS;
  return html`<form class="calc-form calc-form--savings" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Your goal</h3>
  ${radioField({
    id: ids.goalType, name: 'goalType', legend: 'What are you saving for?', value: values.goalType,
    options: [
      { value: 'amount', label: 'A set amount', id: 'savings-type-amount' },
      { value: 'emergency', label: 'An emergency fund', id: 'savings-type-emergency' }
    ]
  })}
  <div class="mode-amount">
    ${numberField({ id: ids.goalAmount, name: 'goalAmount', label: 'Savings goal', prefix: '$', value: values.goalAmount, error: errors.goalAmount })}
  </div>
  <div class="mode-emergency">
    ${numberField({ id: ids.monthlyExpenses, name: 'monthlyExpenses', label: 'Essential monthly expenses', prefix: '$', value: values.monthlyExpenses, hint: 'Housing, utilities, food, insurance, transport and minimum debt payments.', error: errors.monthlyExpenses })}
    ${numberField({ id: ids.coverageMonths, name: 'coverageMonths', label: 'Months of expenses to cover', value: values.coverageMonths, inputmode: 'numeric', hint: 'Three to six months is a common rule of thumb; more if your income is irregular.', error: errors.coverageMonths })}
  </div>
  ${numberField({ id: ids.currentSavings, name: 'currentSavings', label: 'Saved so far', prefix: '$', value: values.currentSavings, optional: true, error: errors.currentSavings })}
  ${numberField({ id: ids.apy, name: 'apy', label: 'APY on your savings', suffix: '%', value: values.apy, optional: true, hint: 'The annual percentage yield your account pays. Enter 0 to leave out interest.', error: errors.apy })}
  <h3 class="form-group-title">Your plan</h3>
  ${radioField({
    id: ids.plan, name: 'plan', legend: 'What do you want to know?', value: values.plan,
    options: [
      { value: 'date', label: 'How much to save each month to reach it by a date', id: 'savings-plan-date' },
      { value: 'deposit', label: 'How long a set monthly deposit takes', id: 'savings-plan-deposit' }
    ]
  })}
  <div class="mode-date">
    ${amountWithUnitField({
      id: ids.timeValue, name: 'timeValue', unitName: 'timeUnit', legend: 'Time to save',
      value: values.timeValue, unit: values.timeUnit, error: errors.timeValue,
      units: [{ value: 'years', label: 'years' }, { value: 'months', label: 'months' }]
    })}
  </div>
  <div class="mode-deposit">
    ${numberField({ id: ids.monthlyDeposit, name: 'monthlyDeposit', label: 'Monthly deposit', prefix: '$', value: values.monthlyDeposit, error: errors.monthlyDeposit })}
  </div>
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
